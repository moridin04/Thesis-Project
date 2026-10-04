from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

EXPORT_KINDS = ("csv", "report")
EXPORT_STATUSES = ("draft", "approved", "unpublished", "superseded", "rejected")


class PublicExport(Base):
    __tablename__ = "public_exports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    columns: Mapped[list] = mapped_column(JSON, nullable=False)
    disclaimer: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft", index=True)
    status_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    data_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ExportAuditLog(Base):
    """Public export workflow events; export_id is NULL for staff report downloads/regenerations."""

    __tablename__ = "export_audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    export_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("public_exports.id"), nullable=True, index=True
    )
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    actor_role: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    detail: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
