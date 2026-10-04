# A file an admin prepares for the public site, either a CSV or a report.
# New rows start as drafts. Approving one marks the older approved row
# of the same kind as superseded. services/public_exports.py does that
# move, and routers/public_exports.py exposes it.
# sha256 is the hash of the file on disk, so we can see if it changed.

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# kind is only ever one of these two. "report" is the HTML report.
EXPORT_KINDS = ("csv", "report")
# draft until review; approved is what the public site serves.
# superseded means a newer approved file of the same kind replaced it.
EXPORT_STATUSES = ("draft", "approved", "unpublished", "superseded", "rejected")


class PublicExport(Base):
    __tablename__ = "public_exports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Column keys the visitor is allowed to see, saved as JSON.
    columns: Mapped[list] = mapped_column(JSON, nullable=False)
    disclaimer: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft", index=True)
    status_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Which barangay data version this file was built from.
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

