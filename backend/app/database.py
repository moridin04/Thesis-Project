# SQLite (or whatever DATABASE_URL points at) and the session helper.
# Models inherit from Base. get_db is the FastAPI dependency that
# opens a session for one request and always closes it.
# init_db creates tables for the models it imports. User and
# Administrator are left out on purpose.

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# SQLite checks that a connection stays on one thread. FastAPI may
# use it from another thread, so we turn that check off for sqlite only.
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Yields a session. The finally block runs even when the route raises.
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Importing the models registers their tables on Base before create_all.
# The noqa is because we import them for that side effect, not to use the names.
def init_db() -> None:
    from app.models import account, audit_log, public_export, upload  # noqa: F401

    Base.metadata.create_all(bind=engine)
