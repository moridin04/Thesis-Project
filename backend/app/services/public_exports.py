from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import generated_files
from app.exports.csv_export import render_csv
from app.exports.html_report import render_report
from app.exports.records import PUBLIC_EXPORT_COLUMNS, ranked_rows
from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.public_export import EXPORT_KINDS, PublicExport
from app.services import barangay_data
from app.services.audit_service import (
    SYSTEM_ACTOR,
    add_audit_log,
    record_audit_log_safely,
    record_public_download,
)

EXPORTS_SUBDIR = "exports"
MANILA_TZ = ZoneInfo("Asia/Manila")
RESOURCE_TYPE = "public_export"

FILE_EXTENSIONS = {"csv": "csv", "report": "html"}
MEDIA_TYPES = {"csv": "text/csv; charset=utf-8", "report": "text/html; charset=utf-8"}
KIND_LABELS = {"csv": "CSV", "report": "HTML"}


def validate_columns(columns: list[str]) -> list[str]:
    if not columns:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Select at least one column.")
    rejected = sorted({column for column in columns if column not in PUBLIC_EXPORT_COLUMNS})
    if rejected:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Columns not allowed in public exports: {', '.join(rejected)}.",
        )
    seen = set(columns)
    return [key for key in PUBLIC_EXPORT_COLUMNS if key in seen]


def _validate_kind(kind: str) -> str:
    if kind not in EXPORT_KINDS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Export type must be one of: {', '.join(EXPORT_KINDS)}.",
        )
    return kind


def _write_snapshot(export: PublicExport, *, final: bool) -> None:
    """Approved snapshots are never rewritten: approval writes a new final file once, from the draft."""
    data_version = barangay_data.current_data_version()
    rows = ranked_rows()
    render = render_csv if export.kind == "csv" else render_report
    content = render(
        title=export.title,
        description=export.description,
        version=export.version,
        data_version=data_version,
        generated_at=datetime.now(MANILA_TZ),
        disclaimer=export.disclaimer,
        columns=export.columns,
        rows=rows,
    )
    suffix = "" if final else "-draft"
    name = f"{export.kind}-v{export.version}-id{export.id}{suffix}.{FILE_EXTENSIONS[export.kind]}"
    path = generated_files.generated_path(EXPORTS_SUBDIR, name)
    path.write_bytes(content)
    export.file_path = str(path)
    export.sha256 = generated_files.sha256_file(path)
    export.row_count = len(rows)
    export.data_version = data_version


def export_label(export: PublicExport) -> str:
    """"CSV v2" / "HTML v2"."""
    return f"{KIND_LABELS.get(export.kind, export.kind.upper())} v{export.version}"


def _audit(db: Session, export: PublicExport, actor_username: str, action: str, extra: str | None = None) -> None:
    details = f"{export_label(export)} - {export.title}" + (f"; {extra}" if extra else "")
    add_audit_log(
        db,
        action=action,
        actor_username=actor_username,
        resource_type=RESOURCE_TYPE,
        resource_id=str(export.id),
        details=details,
    )


def _get(db: Session, export_id: int) -> PublicExport:
    export = db.get(PublicExport, export_id)
    if export is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Export not found.")
    return export


def _require_status(export: PublicExport, *allowed: str) -> None:
    if export.status not in allowed:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Export is {export.status}; this action needs status {' or '.join(allowed)}.",
        )


def list_exports(db: Session) -> list[PublicExport]:
    return db.query(PublicExport).order_by(PublicExport.created_at.desc(), PublicExport.id.desc()).all()


def is_stale(export: PublicExport, current_version: str) -> bool:
    return export.status == "approved" and export.data_version != current_version


def create_draft(
    db: Session,
    actor: Account,
    *,
    kind: str,
    title: str,
    description: str | None,
    columns: list[str],
    disclaimer: str,
) -> PublicExport:
    kind = _validate_kind(kind)
    columns = validate_columns(columns)
    latest = db.query(func.max(PublicExport.version)).filter(PublicExport.kind == kind).scalar() or 0
    export = PublicExport(
        kind=kind,
        version=latest + 1,
        title=title,
        description=description,
        columns=columns,
        disclaimer=disclaimer,
        status="draft",
        created_by=actor.id,
    )
    db.add(export)
    db.flush()
    _write_snapshot(export, final=False)
    _audit(db, export, actor.username, "export_created")
    db.commit()
    db.refresh(export)
    return export


def update_draft(db: Session, actor: Account, export_id: int, changes: dict) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "draft")
    if "columns" in changes:
        changes["columns"] = validate_columns(changes["columns"])
    changed = sorted(key for key, value in changes.items() if getattr(export, key) != value)
    for key, value in changes.items():
        setattr(export, key, value)
    _write_snapshot(export, final=False)
    _audit(db, export, actor.username, "export_edited", f"changed: {', '.join(changed) or 'nothing'}")
    db.commit()
    db.refresh(export)
    return export


def approve(db: Session, actor: Account, export_id: int) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "draft")
    previous = (
        db.query(PublicExport)
        .filter(PublicExport.kind == export.kind, PublicExport.status == "approved", PublicExport.id != export.id)
        .all()
    )
    _write_snapshot(export, final=True)
    export.status = "approved"
    export.approved_by = actor.id
    export.approved_at = datetime.now(timezone.utc)
    for old in previous:
        old.status = "superseded"
        add_audit_log(
            db,
            action="export_superseded",
            actor_username=SYSTEM_ACTOR,
            resource_type=RESOURCE_TYPE,
            resource_id=str(old.id),
            details=f"{export_label(old)} replaced by v{export.version}",
        )
    _audit(db, export, actor.username, "export_approved", f"sha256 {export.sha256[:12]}")
    db.commit()
    db.refresh(export)
    return export


def reject(db: Session, actor: Account, export_id: int, reason: str) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "draft")
    export.status = "rejected"
    export.status_reason = reason
    _audit(db, export, actor.username, "export_rejected", f"reason: {reason}")
    db.commit()
    db.refresh(export)
    return export


def unpublish(db: Session, actor: Account, export_id: int, reason: str) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "approved")
    export.status = "unpublished"
    export.status_reason = reason
    _audit(db, export, actor.username, "export_unpublished", f"reason: {reason}")
    db.commit()
    db.refresh(export)
    return export


def preview_file(db: Session, actor: Account, export_id: int) -> tuple[PublicExport, Path]:
    export = _get(db, export_id)
    path = Path(export.file_path or "")
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Snapshot file is missing.")
    record_audit_log_safely(
        db,
        action="export_previewed",
        actor_username=actor.username,
        resource_type=RESOURCE_TYPE,
        resource_id=str(export.id),
        details=f"{export_label(export)} - {export.title}",
    )
    return export, path


def record_public_download_event(db: Session, export: PublicExport) -> None:
    record_public_download(db, resource_id=str(export.id), label=export_label(export))


def audit_history(db: Session, export_id: int) -> list[AuditLog]:
    """This export's rows from the shared audit_logs table (the one the Audit Log page reads)."""
    _get(db, export_id)
    return (
        db.query(AuditLog)
        .filter(AuditLog.resource_type == RESOURCE_TYPE, AuditLog.resource_id == str(export_id))
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .all()
    )


def latest_approved(db: Session, kind: str) -> PublicExport | None:
    return (
        db.query(PublicExport)
        .filter(PublicExport.kind == kind, PublicExport.status == "approved")
        .order_by(PublicExport.approved_at.desc(), PublicExport.id.desc())
        .first()
    )


def download_filename(export: PublicExport) -> str:
    moment = export.approved_at or export.created_at or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    stamp = moment.astimezone(MANILA_TZ).strftime("%Y-%m-%d")
    base = "AGOS_Barangay_Risk_Summary" if export.kind == "csv" else "AGOS_Barangay_Risk_Report"
    return f"{base}_v{export.version}_{stamp}.{FILE_EXTENSIONS[export.kind]}"
