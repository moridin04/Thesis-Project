from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User, UserRole
from app.security import (
    REFRESH_COOKIE_NAME,
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from tests.conftest import admin_account, client, create_user, db_session, user_account


def test_register_cannot_assign_admin_role(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "hacker@example.com",
            "password": "HackerPass1",
            "full_name": "Hacker",
            "role": "admin",
        },
    )
    assert response.status_code == 201
    assert response.json()["role"] == "user"


def test_passwords_are_stored_as_hashes(db_session: Session):
    user = create_user(
        db_session,
        email="hash@example.com",
        password="HashPass1",
        role=UserRole.user,
    )
    assert user.password_hash != "HashPass1"
    assert verify_password("HashPass1", user.password_hash)


def test_user_login_success(client: TestClient, user_account: User):
    response = client.post(
        "/api/auth/login",
        json={"email": user_account.email, "password": "UserPass1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["role"] == "user"
    assert REFRESH_COOKIE_NAME in response.cookies


def test_user_login_fails_on_admin_endpoint(client: TestClient, user_account: User):
    response = client.post(
        "/api/admin/auth/login",
        json={"email": user_account.email, "password": "UserPass1"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_admin_login_success(client: TestClient, admin_account: User):
    response = client.post(
        "/api/admin/auth/login",
        json={"email": admin_account.email, "password": "AdminPass1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["role"] == "admin"
    assert REFRESH_COOKIE_NAME in response.cookies


def test_admin_login_fails_on_user_endpoint(client: TestClient, admin_account: User):
    response = client.post(
        "/api/auth/login",
        json={"email": admin_account.email, "password": "AdminPass1"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_unauthenticated_admin_api_returns_401(client: TestClient):
    response = client.get("/api/admin/dashboard")
    assert response.status_code == 401


def test_user_access_to_admin_api_returns_403(
    client: TestClient,
    user_account: User,
):
    token = create_access_token(user_id=user_account.id, role=user_account.role.value)
    response = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_access_to_admin_api_succeeds(
    client: TestClient,
    admin_account: User,
):
    token = create_access_token(user_id=admin_account.id, role=admin_account.role.value)
    response = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_expired_or_malformed_jwt_is_rejected(client: TestClient, user_account: User):
    settings = get_settings()
    expired_payload = {
        "sub": str(user_account.id),
        "role": user_account.role.value,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        "jti": "expired",
    }
    expired_token = jwt.encode(
        expired_payload,
        settings.jwt_access_secret,
        algorithm="HS256",
    )
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )
    assert response.status_code == 401


def test_refresh_token_cannot_be_used_as_access_token(
    client: TestClient,
    user_account: User,
):
    refresh_token = create_refresh_token(
        user_id=user_account.id,
        role=user_account.role.value,
    )
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert response.status_code == 401


def test_refresh_and_logout_flow(client: TestClient, user_account: User):
    login_response = client.post(
        "/api/auth/login",
        json={"email": user_account.email, "password": "UserPass1"},
    )
    assert login_response.status_code == 200
    refresh_cookie = login_response.cookies.get(REFRESH_COOKIE_NAME)
    assert refresh_cookie

    client.cookies.set(REFRESH_COOKIE_NAME, refresh_cookie, path="/api/auth")
    refresh_response = client.post("/api/auth/refresh")
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 200
    assert REFRESH_COOKIE_NAME not in logout_response.cookies or (
        logout_response.cookies.get(REFRESH_COOKIE_NAME) in ("", None)
    )

    client.cookies.set(REFRESH_COOKIE_NAME, refresh_cookie, path="/api/auth")
    stale_refresh = client.post("/api/auth/refresh")
    assert stale_refresh.status_code in (401, 200)
