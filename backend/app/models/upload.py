# A dataset file a staff account submitted for review.
# It starts as "pending". An admin approves or rejects it in
# services/upload_service.py. Approving stores a JSON copy of the
# barangay record; rejecting clears that copy and keeps a reason.
# The admin and staff routers are what call that service.

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DatasetUpload(Base):
    __tablename__ = "dataset_uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    uploader_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("accounts.id"), nullable=False, index=True
    )
    uploader_name: Mapped[str] = mapped_column(String(255), nullable=False)
    barangay_name: Mapped[str] = mapped_column(String(255), nullable=False)
    data_type: Mapped[str] = mapped_column(String(128), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    # pending, then approved or rejected. Default is pending.
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Filled on approval, cleared on rejection. Text because it is JSON.
    barangay_record_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
