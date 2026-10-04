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

AdminAccount = Annotated[Account, Depends(require_admin)]
DbSession = Annotated[Session, Depends(get_db)]


def _names(db: Session, ids: set[int | None]) -> dict[int, str]:
    wanted = {i for i in ids if i is not None}
    if not wanted:
        return {}
    return {a.id: a.full_name for a in db.query(Account).filter(Account.id.in_(wanted))}


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


@admin_router.get("", response_model=list[PublicExportOut])
def list_public_exports(_admin: AdminAccount, db: DbSession) -> list[PublicExportOut]:
    return _out(db, service.list_exports(db))


@admin_router.get("/columns")
def list_allowed_columns(_admin: AdminAccount) -> list[dict[str, str]]:
    return [{"key": key, "label": label} for key, (label, _read) in service.PUBLIC_EXPORT_COLUMNS.items()]


@admin_router.post("", response_model=PublicExportOut, status_code=status.HTTP_201_CREATED)
def create_public_export(payload: PublicExportCreate, admin: AdminAccount, db: DbSession) -> PublicExportOut:
    export = service.create_draft(db, admin, **payload.model_dump())
    return _out(db, [export])[0]


@admin_router.patch("/{export_id}", response_model=PublicExportOut)
def update_public_export(
    export_id: int, payload: PublicExportUpdate, admin: AdminAccount, db: DbSession
) -> PublicExportOut:
    export = service.update_draft(db, admin, export_id, payload.model_dump(exclude_unset=True))
    return _out(db, [export])[0]


@admin_router.post("/{export_id}/approve", response_model=PublicExportOut)
def approve_public_export(export_id: int, admin: AdminAccount, db: DbSession) -> PublicExportOut:
    return _out(db, [service.approve(db, admin, export_id)])[0]


@admin_router.post("/{export_id}/reject", response_model=PublicExportOut)
def reject_public_export(
    export_id: int, payload: StatusReason, admin: AdminAccount, db: DbSession
) -> PublicExportOut:
    return _out(db, [service.reject(db, admin, export_id, payload.reason)])[0]


@admin_router.post("/{export_id}/unpublish", response_model=PublicExportOut)
def unpublish_public_export(
    export_id: int, payload: StatusReason, admin: AdminAccount, db: DbSession
) -> PublicExportOut:
    return _out(db, [service.unpublish(db, admin, export_id, payload.reason)])[0]


@admin_router.get("/{export_id}/preview")
def preview_public_export(export_id: int, admin: AdminAccount, db: DbSession) -> FileResponse:
    export, path = service.preview_file(db, admin, export_id)
    return FileResponse(path, media_type=service.MEDIA_TYPES[export.kind], filename=path.name)


@admin_router.get("/{export_id}/audit", response_model=list[ExportAuditOut])
def public_export_audit(export_id: int, _admin: AdminAccount, db: DbSession) -> list[ExportAuditOut]:
    entries = service.audit_history(db, export_id)
    names = _names(db, {e.actor_id for e in entries})
    return [
        ExportAuditOut.model_validate(entry).model_copy(update={"actor_name": names.get(entry.actor_id)})
        for entry in entries
    ]


@public_router.get("", response_model=list[PublicExportMeta])
def list_published_exports(db: DbSession) -> list[PublicExportMeta]:
    published = [service.latest_approved(db, kind) for kind in EXPORT_KINDS]
    return [PublicExportMeta.model_validate(export, from_attributes=True) for export in published if export]


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
    return FileResponse(path, media_type=service.MEDIA_TYPES[kind], filename=service.download_filename(export))
