from __future__ import annotations

import csv
import html
import io
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import generated_files
from app.models.account import Account
from app.models.public_export import EXPORT_KINDS, ExportAuditLog, PublicExport
from app.services import barangay_data

EXPORTS_SUBDIR = "exports"
MANILA_TZ = ZoneInfo("Asia/Manila")


def _score(key: str) -> Callable[[dict], str]:
    def read(record: dict) -> str:
        value = record.get(key)
        return "" if value is None else f"{float(value):.6f}"

    return read


def _text(key: str) -> Callable[[dict], str]:
    def read(record: dict) -> str:
        value = record.get(key)
        return "" if value is None else str(value)

    return read


# The only fields that may leave the server through a public export, in output order.
PUBLIC_EXPORT_COLUMNS: dict[str, tuple[str, Callable[[dict], str]]] = {
    "barangay": ("Barangay", _text("name")),
    "district": ("District", _text("district")),
    "area": ("Area", _text("area")),
    "hazard": ("Hazard", _score("hazard")),
    "exposure": ("Exposure", _score("exposure")),
    "vulnerability": ("Vulnerability", _score("vulnerability")),
    "dpi_scaled": ("DPI_Scaled", _score("dpi_scaled")),
    "priority_class": ("Priority class", _text("risk_category")),
}

FILE_EXTENSIONS = {"csv": "csv", "report": "html"}
MEDIA_TYPES = {"csv": "text/csv; charset=utf-8", "report": "text/html; charset=utf-8"}


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


def _rows(columns: list[str]) -> list[list[str]]:
    getters = [PUBLIC_EXPORT_COLUMNS[key][1] for key in columns]
    return [[read(record) for read in getters] for record in barangay_data.get_all_barangays()]


def render_csv(export: PublicExport, rows: list[list[str]], data_version: str) -> bytes:
    buffer = io.StringIO()
    buffer.write(f"# {export.title}\n")
    buffer.write(f"# Version {export.version}; data version {data_version}\n")
    for line in export.disclaimer.strip().splitlines():
        buffer.write(f"# Disclaimer: {line}\n")
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow([PUBLIC_EXPORT_COLUMNS[key][0] for key in export.columns])
    writer.writerows(rows)
    # BOM so Excel opens the file as UTF-8.
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")


def render_report(export: PublicExport, rows: list[list[str]], data_version: str) -> bytes:
    esc = html.escape
    head = "".join(f"<th>{esc(PUBLIC_EXPORT_COLUMNS[key][0])}</th>" for key in export.columns)
    body = "".join("<tr>" + "".join(f"<td>{esc(value)}</td>" for value in row) + "</tr>" for row in rows)
    description = f'<p class="meta">{esc(export.description)}</p>' if export.description else ""
    document = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{esc(export.title)}</title>
  <style>
    body {{ font-family: "Plus Jakarta Sans", sans-serif; color: #003135; margin: 2rem; }}
    h1 {{ font-size: 1.5rem; margin-bottom: 0.25rem; }}
    .meta {{ font-size: 0.9rem; line-height: 1.5; }}
    .disclaimer {{ margin-top: 0.75rem; padding: 0.75rem 1rem; background: #afdde5; }}
    .rows {{ break-before: page; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.8rem; }}
    th, td {{ border-bottom: 1px solid #afdde5; text-align: left; padding: 0.4rem 0.5rem; }}
    th {{ background: #024950; color: #fff; }}
  </style>
</head>
<body>
  <h1>{esc(export.title)}</h1>
  <p class="meta"><strong>Version:</strong> {export.version} &middot; <strong>Data version:</strong> {esc(data_version)}</p>
  {description}
  <p class="disclaimer"><strong>Disclaimer:</strong> {esc(export.disclaimer)}</p>
  <p class="meta">Records: {len(rows)}.</p>
  <section class="rows">
    <table>
      <thead><tr>{head}</tr></thead>
      <tbody>{body}</tbody>
    </table>
  </section>
</body>
</html>
"""
    return document.encode("utf-8")


def _write_snapshot(export: PublicExport, *, final: bool) -> None:
    data_version = barangay_data.current_data_version()
    rows = _rows(export.columns)
    render = render_csv if export.kind == "csv" else render_report
    suffix = "" if final else "-draft"
    name = f"{export.kind}-v{export.version}-id{export.id}{suffix}.{FILE_EXTENSIONS[export.kind]}"
    path = generated_files.generated_path(EXPORTS_SUBDIR, name)
    path.write_bytes(render(export, rows, data_version))
    export.file_path = str(path)
    export.sha256 = generated_files.sha256_file(path)
    export.row_count = len(rows)
    export.data_version = data_version


def _audit(db: Session, export: PublicExport | None, actor: Account | None, action: str, detail: dict | None = None):
    db.add(
        ExportAuditLog(
            export_id=export.id if export else None,
            actor_id=actor.id if actor else None,
            actor_role=actor.role if actor else None,
            action=action,
            detail=detail,
        )
    )


def record_event(db: Session, actor: Account | None, action: str, detail: dict | None = None) -> None:
    """Audit entry not tied to a public export (staff report downloads and regenerations)."""
    _audit(db, None, actor, action, detail)
    db.commit()


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
    _audit(db, export, actor, "created", {"kind": kind, "version": export.version, "columns": columns})
    db.commit()
    db.refresh(export)
    return export


def update_draft(db: Session, actor: Account, export_id: int, changes: dict) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "draft")
    if "columns" in changes:
        changes["columns"] = validate_columns(changes["columns"])
    for key, value in changes.items():
        setattr(export, key, value)
    _write_snapshot(export, final=False)
    _audit(db, export, actor, "updated", {"fields": sorted(changes)})
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
        _audit(db, old, actor, "superseded", {"superseded_by": export.id})
    _audit(db, export, actor, "approved", {"sha256": export.sha256, "row_count": export.row_count})
    db.commit()
    db.refresh(export)
    return export


def reject(db: Session, actor: Account, export_id: int, reason: str) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "draft")
    export.status = "rejected"
    export.status_reason = reason
    _audit(db, export, actor, "rejected", {"reason": reason})
    db.commit()
    db.refresh(export)
    return export


def unpublish(db: Session, actor: Account, export_id: int, reason: str) -> PublicExport:
    export = _get(db, export_id)
    _require_status(export, "approved")
    export.status = "unpublished"
    export.status_reason = reason
    _audit(db, export, actor, "unpublished", {"reason": reason})
    db.commit()
    db.refresh(export)
    return export


def preview_file(db: Session, actor: Account, export_id: int) -> tuple[PublicExport, Path]:
    export = _get(db, export_id)
    path = Path(export.file_path or "")
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Snapshot file is missing.")
    _audit(db, export, actor, "preview_downloaded")
    db.commit()
    return export, path


def audit_history(db: Session, export_id: int) -> list[ExportAuditLog]:
    _get(db, export_id)
    return (
        db.query(ExportAuditLog)
        .filter(ExportAuditLog.export_id == export_id)
        .order_by(ExportAuditLog.created_at.desc(), ExportAuditLog.id.desc())
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
