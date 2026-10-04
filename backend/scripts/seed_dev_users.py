#!/usr/bin/env python3
"""Create or update the local development staff and admin accounts.

Passwords are read from DEV_SEED_STAFF_PASSWORD and DEV_SEED_ADMIN_PASSWORD in the
environment or in backend/.env (gitignored). Refuses to run when APP_ENV=production.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from pydantic_settings import BaseSettings, SettingsConfigDict  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.models.account import Account  # noqa: E402
from app.security import (  # noqa: E402
    ROLE_ADMIN,
    ROLE_STAFF,
    hash_password,
    validate_password_strength,
    validate_username,
)


# DEV_SEED_* names for the two development accounts.
# Password fields stay empty until the environment or backend/.env sets them.
class DevSeedSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        env_prefix="DEV_SEED_",
        extra="ignore",
    )

    staff_username: str = "lgu_staff"
    staff_name: str = "LGU Staff (dev)"
    staff_password: str = ""
    admin_username: str = "admin"
    admin_name: str = "Administrator (dev)"
    admin_password: str = ""


# Username, display name, role, and password for one account to create or update.
@dataclass(frozen=True)
class DevAccount:
    username: str
    full_name: str
    role: str
    password: str


# Build the staff and admin specs. Raise if either password is missing.
# The error names the missing DEV_SEED_* variables.
def accounts_from_settings(settings: DevSeedSettings) -> list[DevAccount]:
    missing = [
        name
        for name, value in (
            ("DEV_SEED_STAFF_PASSWORD", settings.staff_password),
            ("DEV_SEED_ADMIN_PASSWORD", settings.admin_password),
        )
        if not value
    ]
    if missing:
        raise ValueError(f"Set {', '.join(missing)} in the environment or backend/.env.")
    return [
        DevAccount(settings.staff_username, settings.staff_name, ROLE_STAFF, settings.staff_password),
        DevAccount(settings.admin_username, settings.admin_name, ROLE_ADMIN, settings.admin_password),
    ]


def seed_dev_users(db: Session, accounts: list[DevAccount], *, app_env: str) -> list[tuple[str, str]]:
    """Upsert each account; returns (username, "created" | "updated") pairs."""
    if app_env.lower() == "production":
        raise RuntimeError("Refusing to seed development accounts when APP_ENV=production.")

    results = []
    for spec in accounts:
        username = validate_username(spec.username)
        validate_password_strength(spec.password)
        account = db.query(Account).filter(Account.username == username).first()
        if account is None:
            account = Account(username=username)
            db.add(account)
            action = "created"
        else:
            action = "updated"
        account.password_hash = hash_password(spec.password)
        account.full_name = spec.full_name
        account.role = spec.role
        account.is_active = True
        results.append((username, action))
    db.commit()
    return results


# Read the specs, initialize the database, and seed both accounts.
# Print each username and whether the row was created or updated.
# A missing password or APP_ENV=production ends with exit code 1.
def main() -> int:
    from app.config import get_settings
    from app.database import SessionLocal, init_db

    try:
        accounts = accounts_from_settings(DevSeedSettings())
    except ValueError as exc:
        print(str(exc))
        return 1

    init_db()
    db = SessionLocal()
    try:
        results = seed_dev_users(db, accounts, app_env=get_settings().app_env)
    except (RuntimeError, ValueError) as exc:
        print(str(exc))
        return 1
    finally:
        db.close()

    for username, action in results:
        print(f"Development account {action}: {username}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
