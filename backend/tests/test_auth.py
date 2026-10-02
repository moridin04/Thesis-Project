from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.account import Account
from app.security import REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH
from app.services.auth_service import LOGIN_RATE_LIMIT
from tests.conftest import auth_account, client, db_session

USERNAME = "auth_tester"
PASSWORD = "TestOnlyPass1234"


def _login(client: TestClient):
    return client.post(
        "/api/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
    )


def _refresh_set_cookie(response) -> str:
    headers = response.headers.get_list("set-cookie")
    matches = [h for h in headers if h.startswith(f"{REFRESH_COOKIE_NAME}=")]
    assert len(matches) == 1
    return matches[0].lower()


def test_login_sets_httponly_refresh_cookie(client: TestClient, auth_account: Account):
    response = _login(client)
    assert response.status_code == 200
    assert response.json()["access_token"]

    cookie = _refresh_set_cookie(response)
    assert "httponly" in cookie
    assert f"path={REFRESH_COOKIE_PATH}" in cookie
    assert REFRESH_COOKIE_NAME in client.cookies


def test_login_records_last_login_time(
    client: TestClient,
    db_session: Session,
    auth_account: Account,
):
    assert auth_account.last_login_at is None
    response = _login(client)
    assert response.status_code == 200
    assert response.json()["account"]["last_login_at"] is not None
    db_session.refresh(auth_account)
    assert auth_account.last_login_at is not None


def test_login_rejects_missing_fields(client: TestClient):
    assert client.post("/api/auth/login", json={}).status_code == 422
    assert (
        client.post(
            "/api/auth/login",
            json={"username": USERNAME, "password": ""},
        ).status_code
        == 422
    )


def test_login_rejects_legacy_email_payload(client: TestClient, auth_account: Account):
    response = client.post(
        "/api/auth/login",
        json={"email": "auth_tester@example.com", "password": PASSWORD},
    )
    assert response.status_code == 422


def test_login_rate_limited_after_repeated_attempts(
    client: TestClient,
    auth_account: Account,
):
    for _ in range(LOGIN_RATE_LIMIT):
        client.post(
            "/api/auth/login",
            json={"username": USERNAME, "password": "WrongTestPass1"},
        )
    response = _login(client)
    assert response.status_code == 429
    assert "access_token" not in response.json()


def test_refresh_issues_new_access_token(client: TestClient, auth_account: Account):
    assert _login(client).status_code == 200

    response = client.post("/api/auth/refresh")
    assert response.status_code == 200
    new_token = response.json()["access_token"]
    assert new_token
    _refresh_set_cookie(response)

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me.status_code == 200
    assert me.json()["username"] == USERNAME


def test_refresh_without_cookie_returns_401(client: TestClient):
    response = client.post("/api/auth/refresh")
    assert response.status_code == 401


def test_refresh_rejected_after_account_deactivated(
    client: TestClient,
    db_session: Session,
    auth_account: Account,
):
    assert _login(client).status_code == 200
    auth_account.is_active = False
    db_session.commit()

    response = client.post("/api/auth/refresh")
    assert response.status_code == 401


def test_logout_clears_refresh_cookie(client: TestClient, auth_account: Account):
    assert _login(client).status_code == 200
    assert REFRESH_COOKIE_NAME in client.cookies

    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    cookie = _refresh_set_cookie(response)
    assert "max-age=0" in cookie or "expires=thu, 01 jan 1970" in cookie
    assert REFRESH_COOKIE_NAME not in client.cookies

    assert client.post("/api/auth/refresh").status_code == 401


def test_me_with_valid_token_returns_account(client: TestClient, auth_account: Account):
    token = _login(client).json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == auth_account.id
    assert body["username"] == USERNAME
    assert body["role"] == "staff"
    assert body["is_active"] is True
    assert "password_hash" not in response.text.lower()


def test_me_without_token_returns_401(client: TestClient):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_non_bearer_scheme_returns_401(client: TestClient, auth_account: Account):
    token = _login(client).json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Basic {token}"})
    assert response.status_code == 401


def test_me_rejected_for_deactivated_account(
    client: TestClient,
    db_session: Session,
    auth_account: Account,
):
    token = _login(client).json()["access_token"]
    auth_account.is_active = False
    db_session.commit()

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
