from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.account import Account
from app.security import verify_password
from scripts.seed_dev_users import (
    DevAccount,
    DevSeedSettings,
    accounts_from_settings,
    seed_dev_users,
)
from tests.conftest import client, db_session

STAFF_PASSWORD = "TestOnlyStaff123"
ADMIN_PASSWORD = "TestOnlyAdmin123"


def _accounts() -> list[DevAccount]:
    return [
        DevAccount("lgu_staff", "Staff", "staff", STAFF_PASSWORD),
        DevAccount("Admin", "Admin", "admin", ADMIN_PASSWORD),
    ]


def test_seed_creates_hashed_accounts_with_roles(db_session: Session):
    results = seed_dev_users(db_session, _accounts(), app_env="development")
    assert results == [("lgu_staff", "created"), ("admin", "created")]

    staff = db_session.query(Account).filter_by(username="lgu_staff").one()
    admin = db_session.query(Account).filter_by(username="admin").one()
    assert (staff.role, admin.role) == ("staff", "admin")
    assert staff.password_hash != STAFF_PASSWORD
    assert verify_password(STAFF_PASSWORD, staff.password_hash)
    assert verify_password(ADMIN_PASSWORD, admin.password_hash)


def test_seed_is_idempotent_and_updates_password(db_session: Session):
    seed_dev_users(db_session, _accounts(), app_env="development")
    changed = [DevAccount("lgu_staff", "Staff", "staff", "TestOnlyChanged1")]
    assert seed_dev_users(db_session, changed, app_env="development") == [("lgu_staff", "updated")]
    staff = db_session.query(Account).filter_by(username="lgu_staff").one()
    assert verify_password("TestOnlyChanged1", staff.password_hash)
    assert db_session.query(Account).count() == 2


def test_seed_refuses_production(db_session: Session):
    with pytest.raises(RuntimeError, match="production"):
        seed_dev_users(db_session, _accounts(), app_env="production")
    assert db_session.query(Account).count() == 0


def test_seed_rejects_weak_password(db_session: Session):
    weak = [DevAccount("lgu_staff", "Staff", "staff", "short")]
    with pytest.raises(ValueError, match="12"):
        seed_dev_users(db_session, weak, app_env="development")


def test_settings_require_both_passwords():
    with pytest.raises(ValueError, match="DEV_SEED_ADMIN_PASSWORD"):
        accounts_from_settings(
            DevSeedSettings(_env_file=None, staff_password=STAFF_PASSWORD, admin_password="")
        )


def test_seeded_accounts_can_log_in_with_any_username_casing(client: TestClient, db_session: Session):
    seed_dev_users(db_session, _accounts(), app_env="development")
    staff = client.post("/api/auth/login", json={"username": "lgu_staff", "password": STAFF_PASSWORD})
    admin = client.post("/api/auth/login", json={"username": "Admin", "password": ADMIN_PASSWORD})
    assert staff.status_code == 200 and staff.json()["account"]["role"] == "staff"
    assert admin.status_code == 200 and admin.json()["account"]["role"] == "admin"
