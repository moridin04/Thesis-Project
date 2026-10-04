# Response shape for a dataset upload, plus the reject body.
# file_path stays off this schema so the client never receives it.
# barangay_record is the parsed JSON, not the text column. The service
# in upload_service.py fills that in when it serializes a row.
# Status is pending, approved, or rejected.

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


# Optional note when an admin rejects an upload. Capped at 2000 chars.
class UploadRejectRequest(BaseModel):
    rejection_reason: str = Field(default="", max_length=2000)
