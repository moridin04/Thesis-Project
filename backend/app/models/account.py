# Staff and admin logins for the private side of AGOS.
# Visitors on the public site are not rows in this table. The role
# column is "staff" or "admin", and dependencies/auth.py checks it
# before a route runs. The password column stores a hash only.
# Works with security.py (hashing and tokens) and schemas/account.py.

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# The two roles we allow. Stored on the account as these string values.
class AccountRole(str, enum.Enum):
    staff = "staff"
    admin = "admin"


# One person who can sign in. is_active lets an admin turn the login
# off without deleting the row or its history.
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    # Output of hash_password, never the password the person typed.
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
