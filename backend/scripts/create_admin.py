#!/usr/bin/env python3
"""Create or update an AGOS administrator account (username-based)."""

from __future__ import annotations

import getpass
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.config import get_settings  # noqa: E402
from app.database import SessionLocal, init_db  # noqa: E402
from app.models.account import Account  # noqa: E402
from app.security import (  # noqa: E402
    ROLE_ADMIN,
    hash_password,
    validate_password_strength,
    validate_username,
)


def prompt_password() -> str:
    while True:
        password = getpass.getpass("Administrator password: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Passwords do not match. Try again.")
            continue
        validate_password_strength(password)
        return password


def main() -> int:
    settings = get_settings()
    init_db()

    raw_username = (
        settings.admin_bootstrap_username.strip()
        or input("Administrator username: ").strip()
    )
    if not raw_username:
        print("Username is required.")
        return 1

    try:
        username = validate_username(raw_username)
    except ValueError as exc:
        print(str(exc))
        return 1

    full_name = (
        settings.admin_bootstrap_name.strip()
        or input("Full name [System Administrator]: ").strip()
        or "System Administrator"
    )

    if settings.admin_bootstrap_password:
        password = settings.admin_bootstrap_password
        validate_password_strength(password)
    else:
        password = prompt_password()

    db = SessionLocal()
    try:
        account = db.query(Account).filter(Account.username == username).first()
        if account:
            confirm = input("Account exists. Update it? [y/N]: ").strip().lower()
            if confirm != "y":
                print("Aborted.")
                return 1
            account.password_hash = hash_password(password)
            account.full_name = full_name
            account.role = ROLE_ADMIN
            account.is_active = True
            action = "updated"
        else:
            account = Account(
                username=username,
                password_hash=hash_password(password),
                full_name=full_name,
                role=ROLE_ADMIN,
                is_active=True,
            )
            db.add(account)
            action = "created"

        db.commit()
        print(f"Administrator account {action} for username '{username}'.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
