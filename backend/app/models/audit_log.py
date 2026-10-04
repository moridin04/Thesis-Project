# One row for each sensitive action we want a record of: logins,
# upload reviews, and export approval. audit_service.py is what writes
# these rows, and the admin audit page reads them back.
# We store the username and a short detail string. There is no column
# for IP address or browser, so those are not kept.

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# action is a short name like "export_approved". details is free text
# the caller chooses. actor_username can be empty for a system action.
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    actor_username: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
