from __future__ import annotations

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("JWT_ACCESS_SECRET", "test-access-secret-with-enough-length")
os.environ.setdefault("JWT_REFRESH_SECRET", "test-refresh-secret-with-enough-length")
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.account import Account  # noqa: E402
from app.security import (  # noqa: E402
    ROLE_ADMIN,
    ROLE_STAFF,
    hash_password,
    validate_username,
)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def create_account(
    db: Session,
    *,
    username: str,
    password: str,
    role: str,
    full_name: str = "Test User",
    is_active: bool = True,
) -> Account:
    account = Account(
        username=validate_username(username),
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
        is_active=is_active,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@pytest.fixture()
def admin_account(db_session: Session) -> Account:
    return create_account(
        db_session,
        username="agos_admin",
        password="AdminPass1234",
        role=ROLE_ADMIN,
        full_name="Admin User",
    )


@pytest.fixture()
def staff_account(db_session: Session) -> Account:
    return create_account(
        db_session,
        username="staff01",
        password="StaffPass1234",
        role=ROLE_STAFF,
        full_name="Staff User",
    )
