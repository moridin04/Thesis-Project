from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.security import GENERIC_AUTH_ERROR, GENERIC_RATE_LIMIT_ERROR, ROLE_STAFF
from app.services import auth_service
from app.services.auth_service import LOGIN_RATE_LIMIT
from tests.conftest import admin_account, client, create_account, db_session

PASSWORD = "HardeningPass123"
LOGIN = "/api/auth/login"


@pytest.fixture()
def accounts(db_session: Session) -> None:
    create_account(db_session, username="active_user", password=PASSWORD, role=ROLE_STAFF)
    create_account(
        db_session, username="disabled_user", password=PASSWORD, role=ROLE_STAFF, is_active=False
    )


def _login(client: TestClient, username, password):
    return client.post(LOGIN, json={"username": username, "password": password})


def test_unknown_wrong_and_inactive_are_indistinguishable(client: TestClient, accounts):
    responses = [
        _login(client, "no_such_user", PASSWORD),
        _login(client, "active_user", "WrongPassword123"),
        _login(client, "disabled_user", PASSWORD),
    ]
    for response in responses:
        assert response.status_code == 401
        assert response.json() == {"detail": GENERIC_AUTH_ERROR}
    assert len({r.content for r in responses}) == 1


def test_every_failure_path_runs_one_password_verification(
    client: TestClient, accounts, monkeypatch
):
    calls = []
    real_verify = auth_service.verify_password

    def counting_verify(plain, hashed):
        calls.append(hashed)
        return real_verify(plain, hashed)

    monkeypatch.setattr(auth_service, "verify_password", counting_verify)
    for username, password in [
        ("no_such_user", PASSWORD),
        ("active_user", "WrongPassword123"),
        ("disabled_user", PASSWORD),
        ("active_user", "x" * 5000),
    ]:
        calls.clear()
        _login(client, username, password)
        assert len(calls) == 1, username
    calls.clear()
    _login(client, "no_such_user", PASSWORD)
    assert calls == [auth_service._DUMMY_PASSWORD_HASH]


@pytest.mark.parametrize("username", ["active_user", "no_such_user"])
def test_rate_limited_response_is_generic(client: TestClient, accounts, username):
    for _ in range(LOGIN_RATE_LIMIT):
        _login(client, username, "WrongPassword123")
    response = _login(client, username, PASSWORD)
    assert response.status_code == 429
    assert response.json() == {"detail": GENERIC_RATE_LIMIT_ERROR}


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"username": "", "password": ""},
        {"username": "active_user", "password": ""},
        {"username": "", "password": PASSWORD},
        {"email": "active_user@example.com", "password": PASSWORD},
        {"username": 123, "password": PASSWORD},
    ],
)
def test_empty_or_malformed_input_returns_generic_message(client: TestClient, accounts, payload):
    response = client.post(LOGIN, json=payload)
    assert response.status_code == 422
    assert response.json() == {"detail": GENERIC_AUTH_ERROR}
    assert PASSWORD not in response.text


def test_malformed_json_returns_generic_message(client: TestClient):
    response = client.post(LOGIN, content=b"{bad", headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert response.json() == {"detail": GENERIC_AUTH_ERROR}


@pytest.mark.parametrize(
    "username,password",
    [("a" * 40, PASSWORD), ("Bad Name!", PASSWORD), ("active_user", "short"), ("active_user", "x" * 200)],
)
def test_login_does_not_reveal_format_or_length_rules(client: TestClient, accounts, username, password):
    response = _login(client, username, password)
    assert response.status_code == 401
    assert response.json() == {"detail": GENERIC_AUTH_ERROR}


def test_failure_reasons_only_in_audit_log(client: TestClient, db_session: Session, accounts):
    bodies = [
        _login(client, "no_such_user", PASSWORD).text,
        _login(client, "active_user", "WrongPassword123").text,
        _login(client, "disabled_user", PASSWORD).text,
    ]
    for _ in range(LOGIN_RATE_LIMIT):
        bodies.append(_login(client, "active_user", "WrongPassword123").text)

    reasons = [
        (row.actor_username, row.details)
        for row in db_session.query(AuditLog).filter(AuditLog.action == "login_failed").order_by(AuditLog.id)
    ]
    assert reasons[:3] == [
        ("no_such_user", "unknown_user"),
        ("active_user", "wrong_password"),
        ("disabled_user", "inactive_account"),
    ]
    assert reasons[-1] == ("active_user", "rate_limited")
    for body in bodies:
        for reason in ("unknown_user", "wrong_password", "inactive_account", "rate_limited"):
            assert reason not in body


def test_other_routes_keep_detailed_validation(client: TestClient, admin_account):
    token = _login(client, "agos_admin", "AdminPass1234").json()["access_token"]
    response = client.post(
        "/api/admin/accounts",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "ab", "full_name": "Bad", "password": "ValidPass12345", "role": "staff"},
    )
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)
