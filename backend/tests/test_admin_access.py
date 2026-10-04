# Who may open the operations dashboard and the admin routes.
# Covers the role checks in app.dependencies.auth and the admin router.
# Staff may use operations. Admin pages, account creation, and publish
# stay on the admin role. A missing or bad token is rejected. The last
# active administrator cannot be deactivated.

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


# Staff can open the operations dashboard. That route allows both roles.
def test_staff_can_access_operations(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.get(
        "/api/operations/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


# The admin dashboard is admin-only. A staff token receives 403.
def test_staff_forbidden_from_admin_endpoints(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


# Creating accounts is an admin action. Staff receive 403.
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


# Publishing a dataset is admin-only. Staff receive 403.
def test_staff_cannot_publish_datasets(client: TestClient, staff_account):
    token = _login(client, "staff01", "StaffPass1234")
    response = client.post(
        "/api/admin/datasets/d1/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


# An admin token can open the admin dashboard.
def test_admin_can_access_admin_endpoints(client: TestClient, admin_account):
    token = _login(client, "agos_admin", "AdminPass1234")
    response = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


# An admin can publish a dataset. The status in the body is published.
def test_admin_can_publish_dataset(client: TestClient, admin_account):
    token = _login(client, "agos_admin", "AdminPass1234")
    response = client.post(
        "/api/admin/datasets/d1/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "published"


# With no token, both dashboards return 401.
def test_anonymous_protected_returns_401(client: TestClient):
    assert client.get("/api/operations/dashboard").status_code == 401
    assert client.get("/api/admin/dashboard").status_code == 401


# A bearer token that is not valid, and one that is already expired,
# are both rejected on /api/auth/me.
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


# A refresh token cannot be used as the access token.
# An access token cannot be used as the refresh cookie.
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


# Logout succeeds, and the account list leaves out the password hash.
def test_logout_and_password_hash_never_returned(client: TestClient, admin_account):
    token = _login(client, "agos_admin", "AdminPass1234")
    assert client.post("/api/auth/logout").status_code == 200
    accounts = client.get(
        "/api/admin/accounts",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert accounts.status_code == 200
    assert "password_hash" not in accounts.text.lower()


# The status route refuses to deactivate the only active administrator.
# That keeps the admin routes from being locked with no one left to sign in.
def test_cannot_deactivate_final_admin(client: TestClient, admin_account):
    token = _login(client, "agos_admin", "AdminPass1234")
    response = client.patch(
        f"/api/admin/accounts/{admin_account.id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False},
    )
    assert response.status_code == 400
