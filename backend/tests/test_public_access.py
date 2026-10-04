# Pages a visitor can open, and the login rules beside them.
# Covers the public router and app.services.auth_service.
# Overview and barangay reads need no account. There is no public sign-up.
# Unknown and wrong-password replies match. The client cannot set its role,
# and the password hash is stored and kept off the response.

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.security import ROLE_STAFF, hash_password, verify_password
from tests.conftest import admin_account, client, create_account, db_session, staff_account


# Overview loads with no token, and the body has no password hash.
def test_public_overview_without_authentication(client: TestClient):
    response = client.get("/api/public/overview")
    assert response.status_code == 200
    assert response.json()["system_name"] == "AGOS Manila"
    assert "password_hash" not in response.text.lower()


# The barangay list and the Barangay 310 detail load with no token.
def test_public_barangays_without_authentication(client: TestClient):
    listing = client.get("/api/public/barangays")
    assert listing.status_code == 200
    detail = client.get("/api/public/barangays/Barangay%20310")
    assert detail.status_code == 200
    assert detail.json()["district"] == "District III"


# There is no register route under /api/auth or /api/admin/auth.
def test_no_public_registration(client: TestClient):
    assert client.post("/api/auth/register", json={}).status_code == 404
    assert client.post("/api/admin/auth/register", json={}).status_code == 404


# POST on the public overview is 405. Visitors do not write through that path.
def test_public_modification_rejected(client: TestClient):
    assert client.post("/api/public/overview", json={}).status_code == 405


# Login accepts username and password. The account body has no email or hash.
def test_login_accepts_username_password(client: TestClient, staff_account):
    response = client.post(
        "/api/auth/login",
        json={"username": "staff01", "password": "StaffPass1234"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["account"]["role"] == "staff"
    assert body["account"]["username"] == "staff01"
    assert "password_hash" not in body
    assert "email" not in body["account"]


# STAFF01 matches staff01 because the username is lowercased before lookup.
def test_login_case_insensitive_username(client: TestClient, staff_account):
    response = client.post(
        "/api/auth/login",
        json={"username": "STAFF01", "password": "StaffPass1234"},
    )
    assert response.status_code == 200


# A role sent in the login body is ignored. The role comes from the account row.
def test_login_does_not_trust_client_role(client: TestClient, staff_account):
    response = client.post(
        "/api/auth/login",
        json={
            "username": "staff01",
            "password": "StaffPass1234",
            "role": "admin",
        },
    )
    assert response.status_code == 200
    assert response.json()["account"]["role"] == "staff"


# The agos_admin account can log in, and the returned role is admin.
def test_admin_login_succeeds(client: TestClient, admin_account):
    response = client.post(
        "/api/auth/login",
        json={"username": "agos_admin", "password": "AdminPass1234"},
    )
    assert response.status_code == 200
    assert response.json()["account"]["role"] == "admin"


# A missing username and a wrong password return the same 401 detail.
def test_generic_login_errors(client: TestClient, staff_account):
    unknown = client.post(
        "/api/auth/login",
        json={"username": "missing_user", "password": "StaffPass1234"},
    )
    wrong = client.post(
        "/api/auth/login",
        json={"username": "staff01", "password": "WrongPassword1"},
    )
    assert unknown.status_code == 401
    assert wrong.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]


# An inactive account receives 401 even when the password matches.
def test_inactive_account_cannot_login(client: TestClient, db_session: Session):
    create_account(
        db_session,
        username="inactive1",
        password="StaffPass1234",
        role=ROLE_STAFF,
        is_active=False,
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "inactive1", "password": "StaffPass1234"},
    )
    assert response.status_code == 401


# The stored value is a hash. It is not the password that was submitted.
def test_passwords_stored_as_hashes(db_session: Session):
    account = create_account(
        db_session,
        username="hashuser",
        password="StaffPass1234",
        role=ROLE_STAFF,
    )
    assert account.password_hash != "StaffPass1234"
    assert verify_password("StaffPass1234", account.password_hash)


# Admin create rejects a username that fails validate_username.
def test_invalid_username_rejected_on_create(client: TestClient, admin_account):
    token = client.post(
        "/api/auth/login",
        json={"username": "agos_admin", "password": "AdminPass1234"},
    ).json()["access_token"]
    response = client.post(
        "/api/admin/accounts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "username": "ab",
            "full_name": "Bad",
            "password": "StaffPass1234",
            "role": "staff",
        },
    )
    assert response.status_code in (400, 422)
