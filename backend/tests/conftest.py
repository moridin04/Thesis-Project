# Shared fixtures for the backend tests.
# JWT settings have no default, so we set them before importing the app.
# Tests use an in-memory SQLite database and their own tables.
# The login attempt counter is cleared around every test so one test
# cannot leave the next one rate-limited.

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
from app.services import auth_service  # noqa: E402


# Clear stored login attempts before and after every test.
@pytest.fixture(autouse=True)
def reset_login_rate_limit() -> Generator[None, None, None]:
    # The limiter is process-global; without a reset, login counts leak across tests.
    auth_service._login_attempts.clear()
    yield
    auth_service._login_attempts.clear()


# In-memory SQLite for one test. Tables are created here and dropped after.
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


# HTTP client whose database dependency is this test's session.
# The override is removed when the test ends.
@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    # Hand this test's session to routes that depend on get_db.
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# Save one account. The password is hashed before it is written.
# The caller picks the username, role, and whether the account is active.
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


# Active admin account. The username is agos_admin.
@pytest.fixture()
def admin_account(db_session: Session) -> Account:
    return create_account(
        db_session,
        username="agos_admin",
        password="AdminPass1234",
        role=ROLE_ADMIN,
        full_name="Admin User",
    )


# Active staff account. The username is staff01.
@pytest.fixture()
def staff_account(db_session: Session) -> Account:
    return create_account(
        db_session,
        username="staff01",
        password="StaffPass1234",
        role=ROLE_STAFF,
        full_name="Staff User",
    )


# Staff account for the auth tests. The username is auth_tester.
@pytest.fixture()
def auth_account(db_session: Session) -> Account:
    return create_account(
        db_session,
        username="auth_tester",
        password="TestOnlyPass1234",
        role=ROLE_STAFF,
        full_name="Auth Tester",
    )
