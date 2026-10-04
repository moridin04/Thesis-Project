# Staff dataset uploads: save the file, then an admin approves or rejects it.
# Approved rows keep a JSON copy of the matching barangay from barangay_data.
# The operations router submits uploads. The admin router reviews them.
# The public router returns only those approved JSON copies.
# audit_service records submit, approve, and reject.

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.upload import DatasetUpload
from app.schemas.upload import UploadPublic
from app.services.audit_service import record_audit_log
from app.services.barangay_data import get_barangay_by_id

# Saved files go in backend/uploads, beside the app package.
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
# The only status values the queue filter and the review actions accept.
VALID_STATUSES = {"pending", "approved", "rejected"}
# Must match UPLOAD_DATA_TYPES in frontend/src/utils/uploadDataTypes.js. Older rows may hold
# free-text values from before this list existed; they are still stored and returned as-is.
VALID_DATA_TYPES = (
    "flood_hazard_5yr",
    "flood_hazard_25yr",
    "elevation_dtm",
    "population",
    "barangay_boundaries",
    "other",
)


# Create backend/uploads on the first save. Later saves reuse that folder.
def _ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


# Lowercase text, turn other characters into hyphens, and strip end hyphens.
def _slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


# Barangay fields copied at approval. The name must match the Barangay column.
# An unknown name is still stored, marked for manual review.
def _barangay_record_for_upload(upload: DatasetUpload) -> dict:
    matched = get_barangay_by_id(upload.barangay_name)
    if matched is None:
        return {
            "id": upload.id,
            "barangay": upload.barangay_name,
            "district": None,
            "riskLevel": None,
            "dpi": None,
            "population": None,
            "floodPct25yr": None,
            "elevationMean": None,
            "match_status": "Unmatched — requires manual review",
        }
    return {
        "id": matched["id"],
        "barangay": matched["name"],
        "district": matched["district"],
        "riskLevel": matched["risk_category"],
        "dpi": matched["dpi"],
        "population": matched["population_2024"],
        "floodPct25yr": matched["flood_pct_25yr"],
        "elevationMean": matched["elevation_mean"],
        "match_status": "matched",
    }


# API shape for one row. Snapshot JSON that cannot be parsed becomes null.
def serialize_upload(upload: DatasetUpload) -> UploadPublic:
    barangay_record = None
    if upload.barangay_record_json:
        try:
            barangay_record = json.loads(upload.barangay_record_json)
        except json.JSONDecodeError:
            barangay_record = None

    return UploadPublic(
        id=upload.id,
        uploader_id=upload.uploader_id,
        uploader_name=upload.uploader_name,
        barangay_name=upload.barangay_name,
        data_type=upload.data_type,
        notes=upload.notes,
        file_name=upload.file_name,
        status=upload.status,
        rejection_reason=upload.rejection_reason,
        created_at=upload.created_at,
        barangay_record=barangay_record,
    )


# Reject an unknown data type, store the file under a new name, and keep it pending.
async def create_upload(
    db: Session,
    *,
    account: Account,
    barangay_name: str,
    data_type: str,
    notes: str,
    file: Optional[UploadFile],
) -> UploadPublic:
    data_type = data_type.strip()
    if data_type not in VALID_DATA_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Unknown data type.",
        )

    file_name = None
    file_path = None

    if file is not None and file.filename:
        upload_dir = _ensure_upload_dir()
        # Drop any folder in the client filename so the write stays inside uploads.
        safe_name = Path(file.filename).name
        # Random prefix so two uploads of the same filename do not overwrite.
        stored_name = f"{uuid4().hex}_{safe_name}"
        destination = upload_dir / stored_name
        content = await file.read()
        destination.write_bytes(content)
        file_name = safe_name
        file_path = str(destination)

    upload = DatasetUpload(
        uploader_id=account.id,
        uploader_name=account.full_name or account.username,
        barangay_name=barangay_name.strip(),
        data_type=data_type,
        notes=notes.strip() or None,
        file_name=file_name,
        file_path=file_path,
        status="pending",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    record_audit_log(
        db,
        action="upload_submitted",
        actor_username=account.username,
        resource_type="upload",
        resource_id=str(upload.id),
        details=f"{upload.barangay_name} ({upload.data_type})",
    )

    return serialize_upload(upload)


# Uploads submitted by this account, newest first.
def list_uploads_for_user(db: Session, account_id: int) -> list[UploadPublic]:
    rows = (
        db.query(DatasetUpload)
        .filter(DatasetUpload.uploader_id == account_id)
        .order_by(DatasetUpload.created_at.desc())
        .all()
    )
    return [serialize_upload(row) for row in rows]


# Full queue for an admin. A status filter has to be one of the known statuses.
def list_uploads(
    db: Session,
    *,
    status_filter: Optional[str] = None,
) -> list[UploadPublic]:
    query = db.query(DatasetUpload)
    if status_filter:
        if status_filter not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status filter.",
            )
        query = query.filter(DatasetUpload.status == status_filter)
    rows = query.order_by(DatasetUpload.created_at.desc()).all()
    return [serialize_upload(row) for row in rows]


# One upload by id, or 404. Approve and reject both start here.
def get_upload(db: Session, upload_id: int) -> DatasetUpload:
    upload = db.query(DatasetUpload).filter(DatasetUpload.id == upload_id).first()
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")
    return upload


# Pending rows only. We store the barangay snapshot and clear any old reason.
def approve_upload(db: Session, upload_id: int, actor: Account) -> UploadPublic:
    upload = get_upload(db, upload_id)
    if upload.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending uploads can be approved.",
        )

    barangay_record = _barangay_record_for_upload(upload)
    upload.status = "approved"
    upload.rejection_reason = None
    upload.barangay_record_json = json.dumps(barangay_record)
    db.commit()
    db.refresh(upload)

    record_audit_log(
        db,
        action="upload_approved",
        actor_username=actor.username,
        resource_type="upload",
        resource_id=str(upload.id),
        details=upload.barangay_name,
    )

    return serialize_upload(upload)


# Pending rows only. The snapshot is cleared and the reason is kept for the log.
def reject_upload(
    db: Session,
    upload_id: int,
    actor: Account,
    rejection_reason: str = "",
) -> UploadPublic:
    upload = get_upload(db, upload_id)
    if upload.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending uploads can be rejected.",
        )

    upload.status = "rejected"
    upload.rejection_reason = rejection_reason.strip() or None
    upload.barangay_record_json = None
    db.commit()
    db.refresh(upload)

    details = upload.barangay_name
    if upload.rejection_reason:
        details = f"{details}: {upload.rejection_reason}"

    record_audit_log(
        db,
        action="upload_rejected",
        actor_username=actor.username,
        resource_type="upload",
        resource_id=str(upload.id),
        details=details,
    )

    return serialize_upload(upload)


# Approved rows for the public page. The JSON saved at approval is preferred.
def list_approved_barangay_records(db: Session) -> list[dict]:
    rows = (
        db.query(DatasetUpload)
        .filter(DatasetUpload.status == "approved")
        .order_by(DatasetUpload.created_at.desc())
        .all()
    )
    records: list[dict] = []
    for row in rows:
        if row.barangay_record_json:
            try:
                records.append(json.loads(row.barangay_record_json))
                continue
            except json.JSONDecodeError:
                # Corrupt JSON falls through, and we rebuild from the current barangay table.
                pass
        records.append(_barangay_record_for_upload(row))
    return records
