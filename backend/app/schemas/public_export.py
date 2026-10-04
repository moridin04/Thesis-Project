# Request and response bodies for public exports.
# Admins create a draft, then approve, reject, or unpublish it.
# Visitors only get PublicExportMeta (no file path, no hash, no
# account ids). The routes are in routers/public_exports.py.
# Timestamps are tagged as UTC because SQLite returns them naive.

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, StringConstraints


# SQLite stores datetimes without a timezone. We treat those as UTC.
def _as_utc(value: datetime | None) -> datetime | None:
    # SQLite returns naive datetimes; they are stored in UTC.
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]

# Titles and the disclaimer cannot be blank after trimming. Length caps
# match the columns on the public_exports table.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]
Disclaimer = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
# Required text when an admin rejects or unpublishes. Approve has no reason.
Reason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


# Body for a new draft. kind is checked again in the service.
class PublicExportCreate(BaseModel):
    kind: str
    title: Title
    description: Optional[Description] = None
    columns: list[str]
    disclaimer: Disclaimer


# Partial edit of a draft. Fields left out stay as they are.
class PublicExportUpdate(BaseModel):
    title: Optional[Title] = None
    description: Optional[Description] = None
    columns: Optional[list[str]] = None
    disclaimer: Optional[Disclaimer] = None


# Reason text for reject and unpublish.
class StatusReason(BaseModel):
    reason: Reason


# What the admin list shows. Names and stale are filled by the router,
# not stored as columns. stale means the data version has moved on.
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


# The small set of fields the public site is allowed to see.
class PublicExportMeta(BaseModel):
    kind: str
    title: str
    version: int
    approved_at: Optional[UtcDatetime]
    row_count: Optional[int]
    disclaimer: str
