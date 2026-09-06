from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

from app.config import get_settings
from app.security import (
    REFRESH_COOKIE_NAME,
    create_access_token,
    create_refresh_token,
)
from tests.conftest import admin_account, client, staff_account


def _login(client: TestClient, username: str, password: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_staff_can_access_operations(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.get(
        "/api/operations/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_staff_forbidden_from_admin_endpoints(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_staff_cannot_create_accounts(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.post(
        "/api/admin/accounts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "username": "newstaff",
            "full_name": "New",
            "password": "StaffPass1234",
            "role": "staff",
        },
    )
    assert response.status_code == 403


def test_staff_cannot_publish_datasets(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.post(
        "/api/admin/datasets/d1/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_can_access_admin_endpoints(client: TestClient, admin_account):
    token = _login(client, "sagip_admin", "AdminPass1234")
    response = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_admin_can_publish_dataset(client: TestClient, admin_account):
    token = _login(client, "sagip_admin", "AdminPass1234")
    response = client.post(
        "/api/admin/datasets/d1/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "published"


def test_anonymous_protected_returns_401(client: TestClient):
    assert client.get("/api/operations/dashboard").status_code == 401
    assert client.get("/api/admin/dashboard").status_code == 401


def test_malformed_and_expired_tokens_rejected(client: TestClient, staff_account):
    assert (
        client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer not-valid"},
        ).status_code
        == 401
    )

    settings = get_settings()
    expired = jwt.encode(
        {
            "sub": str(staff_account.id),
            "role": "staff",
            "type": "access",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            "jti": "x",
        },
        settings.jwt_access_secret,
        algorithm="HS256",
    )
    assert (
        client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired}"},
        ).status_code
        == 401
    )


def test_token_type_interchange_rejected(client: TestClient, staff_account):
    refresh = create_refresh_token(account_id=staff_account.id, role="staff")
    assert (
        client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {refresh}"},
        ).status_code
        == 401
    )

    access = create_access_token(account_id=staff_account.id, role="staff")
    client.cookies.set(REFRESH_COOKIE_NAME, access, path="/api/auth")
    assert client.post("/api/auth/refresh").status_code == 401


def test_logout_and_password_hash_never_returned(client: TestClient, admin_account):
    token = _login(client, "sagip_admin", "AdminPass1234")
    assert client.post("/api/auth/logout").status_code == 200
    accounts = client.get(
        "/api/admin/accounts",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert accounts.status_code == 200
    assert "password_hash" not in accounts.text.lower()


def test_cannot_deactivate_final_admin(client: TestClient, admin_account):
    token = _login(client, "sagip_admin", "AdminPass1234")
    response = client.patch(
        f"/api/admin/accounts/{admin_account.id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False},
    )
    assert response.status_code == 400
