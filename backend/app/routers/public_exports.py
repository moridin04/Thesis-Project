# Two routers for files an admin prepares for the public site.
# Admins work at /api/admin/public-exports. Visitors download at
# /api/public/exports with no login. Rows are the PublicExport model.
# services/public_exports.py writes the file, checks columns, and approves.
# A public download is audited as actor "public", with no IP or user agent.

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.account import Account
from app.models.public_export import EXPORT_KINDS, PublicExport
from app.schemas.public_export import (
    ExportAuditOut,
    PublicExportCreate,
    PublicExportMeta,
    PublicExportOut,
    PublicExportUpdate,
    StatusReason,
)
from app.services import barangay_data
from app.services import public_exports as service

admin_router = APIRouter(prefix="/admin/public-exports", tags=["admin", "public-exports"])
public_router = APIRouter(prefix="/public/exports", tags=["public"])

# Active admin only. Used on every admin route in this file.
AdminAccount = Annotated[Account, Depends(require_admin)]
# Request database session, shared by the admin and public routes.
DbSession = Annotated[Session, Depends(get_db)]


# Map account ids to full names for the created-by and approved-by labels.
# Ids that are missing are skipped. An empty set returns an empty dict.
def _names(db: Session, ids: set[int | None]) -> dict[int, str]:
    wanted = {i for i in ids if i is not None}
    if not wanted:
        return {}
    return {a.id: a.full_name for a in db.query(Account).filter(Account.id.in_(wanted))}


# Build PublicExportOut rows and fill in names plus the stale flag.
# stale means an approved file's data version is not the current one.
def _out(db: Session, exports: list[PublicExport]) -> list[PublicExportOut]:
    current = barangay_data.current_data_version()
    names = _names(db, {e.created_by for e in exports} | {e.approved_by for e in exports})
    return [
        PublicExportOut.model_validate(export).model_copy(
            update={
                "created_by_name": names.get(export.created_by),
                "approved_by_name": names.get(export.approved_by),
                "stale": service.is_stale(export, current),
            }
        )
        for export in exports
    ]


# Every export for the admin table, newest first.
@admin_router.get("", response_model=list[PublicExportOut])
def list_public_exports(_admin: AdminAccount, db: DbSession) -> list[PublicExportOut]:
    return _out(db, service.list_exports(db))


# Column keys and labels an admin may include. The whitelist is
# PUBLIC_EXPORT_COLUMNS. Rank is added by the file writer, not chosen here.
@admin_router.get("/columns")
def list_allowed_columns(_admin: AdminAccount) -> list[dict[str, str]]:
    return [{"key": key, "label": label} for key, label in service.PUBLIC_EXPORT_COLUMNS.items()]


# Save a new draft and a snapshot file. The service sets status to draft.
@admin_router.post("", response_model=PublicExportOut, status_code=status.HTTP_201_CREATED)
def create_public_export(payload: PublicExportCreate, admin: AdminAccount, db: DbSession) -> PublicExportOut:
    export = service.create_draft(db, admin, **payload.model_dump())
    return _out(db, [export])[0]


# Edit a draft. Fields left out of the body stay as they are.
# The service allows this only while status is still draft.
@admin_router.patch("/{export_id}", response_model=PublicExportOut)
def update_public_export(
    export_id: int, payload: PublicExportUpdate, admin: AdminAccount, db: DbSession
) -> PublicExportOut:
    export = service.update_draft(db, admin, export_id, payload.model_dump(exclude_unset=True))
    return _out(db, [export])[0]


# Approve a draft. The service writes the final file, marks older approved
# rows of the same kind as superseded, and logs export_approved.
@admin_router.post("/{export_id}/approve", response_model=PublicExportOut)
def approve_public_export(export_id: int, admin: AdminAccount, db: DbSession) -> PublicExportOut:
    return _out(db, [service.approve(db, admin, export_id)])[0]


# Reject a draft and store the reason. StatusReason requires that text.
# The service allows this only while status is still draft.
@admin_router.post("/{export_id}/reject", response_model=PublicExportOut)
def reject_public_export(
    export_id: int, payload: StatusReason, admin: AdminAccount, db: DbSession
) -> PublicExportOut:
    return _out(db, [service.reject(db, admin, export_id, payload.reason)])[0]


# Take an approved file off the public list and store the reason.
# The service allows this only when the current status is approved.
@admin_router.post("/{export_id}/unpublish", response_model=PublicExportOut)
def unpublish_public_export(
    export_id: int, payload: StatusReason, admin: AdminAccount, db: DbSession
) -> PublicExportOut:
    return _out(db, [service.unpublish(db, admin, export_id, payload.reason)])[0]


# Send the snapshot file to the admin. A missing file is 404.
# Preview is logged as export_previewed. A failed audit write still sends the file.
@admin_router.get("/{export_id}/preview")
def preview_public_export(export_id: int, admin: AdminAccount, db: DbSession) -> FileResponse:
    export, path = service.preview_file(db, admin, export_id)
    return FileResponse(path, media_type=service.MEDIA_TYPES[export.kind], filename=path.name)


# Audit rows for this one export, newest first, from the shared audit table.
@admin_router.get("/{export_id}/audit", response_model=list[ExportAuditOut])
def public_export_audit(export_id: int, _admin: AdminAccount, db: DbSession) -> list[ExportAuditOut]:
    return [ExportAuditOut.model_validate(entry) for entry in service.audit_history(db, export_id)]


# Latest approved file for each kind. EXPORT_KINDS is csv, then report.
# A kind with no approved row is left out. Meta hides path, hash, and account ids.
@public_router.get("", response_model=list[PublicExportMeta])
def list_published_exports(db: DbSession) -> list[PublicExportMeta]:
    published = [service.latest_approved(db, kind) for kind in EXPORT_KINDS]
    return [PublicExportMeta.model_validate(export, from_attributes=True) for export in published if export]


# Download the latest approved file for one kind. No login is required.
# Unknown kind, or no file on disk, is 404. The download event uses actor
# "public" and does not store an IP or user agent.
@public_router.get("/{kind}/download")
def download_published_export(kind: str, db: DbSession) -> FileResponse:
    if kind not in EXPORT_KINDS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown export type.")
    export = service.latest_approved(db, kind)
    path = Path(export.file_path) if export and export.file_path else None
    if export is None or path is None or not path.is_file():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="No approved public export is available for this type yet.",
        )
    service.record_public_download_event(db, export)
    return FileResponse(path, media_type=service.MEDIA_TYPES[kind], filename=service.download_filename(export))
