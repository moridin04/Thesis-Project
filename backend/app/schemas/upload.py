from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class UploadPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uploader_id: int
    uploader_name: str
    barangay_name: str
    data_type: str
    notes: Optional[str] = None
    file_name: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    barangay_record: Optional[dict[str, Any]] = None


class UploadRejectRequest(BaseModel):
    rejection_reason: str = Field(default="", max_length=2000)
