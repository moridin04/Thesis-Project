from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, StringConstraints


def _as_utc(value: datetime | None) -> datetime | None:
    # SQLite returns naive datetimes; they are stored in UTC.
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]
Disclaimer = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
Reason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class PublicExportCreate(BaseModel):
    kind: str
    title: Title
    description: Optional[Description] = None
    columns: list[str]
    disclaimer: Disclaimer


class PublicExportUpdate(BaseModel):
    title: Optional[Title] = None
    description: Optional[Description] = None
    columns: Optional[list[str]] = None
    disclaimer: Optional[Disclaimer] = None


class StatusReason(BaseModel):
    reason: Reason


class PublicExportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    version: int
    title: str
    description: Optional[str]
    columns: list[str]
    disclaimer: str
    status: str
    status_reason: Optional[str]
    sha256: Optional[str]
    row_count: Optional[int]
    data_version: Optional[str]
    created_by: int
    created_by_name: Optional[str] = None
    approved_by: Optional[int]
    approved_by_name: Optional[str] = None
    approved_at: Optional[UtcDatetime]
    created_at: UtcDatetime
    updated_at: UtcDatetime
    stale: bool = False


class ExportAuditOut(BaseModel):
    """One audit_logs row for a public export."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    actor_username: Optional[str]
    details: Optional[str]
    created_at: UtcDatetime


class PublicExportMeta(BaseModel):
    kind: str
    title: str
    version: int
    approved_at: Optional[UtcDatetime]
    row_count: Optional[int]
    disclaimer: str
