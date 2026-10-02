from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.security import ROLE_STAFF, hash_password, verify_password
from tests.conftest import admin_account, client, create_account, db_session, staff_account


def test_public_overview_without_authentication(client: TestClient):
    response = client.get("/api/public/overview")
    assert response.status_code == 200
    assert response.json()["system_name"] == "AGOS Manila"
    assert "password_hash" not in response.text.lower()


def test_public_barangays_without_authentication(client: TestClient):
    listing = client.get("/api/public/barangays")
    assert listing.status_code == 200
    detail = client.get("/api/public/barangays/Barangay%20310")
    assert detail.status_code == 200
    assert detail.json()["district"] == "District III"


def test_no_public_registration(client: TestClient):
    assert client.post("/api/auth/register", json={}).status_code == 404
    assert client.post("/api/admin/auth/register", json={}).status_code == 404


def test_public_modification_rejected(client: TestClient):
    assert client.post("/api/public/overview", json={}).status_code == 405


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


def test_login_case_insensitive_username(client: TestClient, staff_account):
    response = client.post(
        "/api/auth/login",
        json={"username": "STAFF01", "password": "StaffPass1234"},
    )
    assert response.status_code == 200


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


def test_admin_login_succeeds(client: TestClient, admin_account):
    response = client.post(
        "/api/auth/login",
        json={"username": "agos_admin", "password": "AdminPass1234"},
    )
    assert response.status_code == 200
    assert response.json()["account"]["role"] == "admin"


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


def test_passwords_stored_as_hashes(db_session: Session):
    account = create_account(
        db_session,
        username="hashuser",
        password="StaffPass1234",
        role=ROLE_STAFF,
    )
    assert account.password_hash != "StaffPass1234"
    assert verify_password("StaffPass1234", account.password_hash)


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
