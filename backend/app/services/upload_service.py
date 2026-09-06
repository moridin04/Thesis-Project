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

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
VALID_STATUSES = {"pending", "approved", "rejected"}


def _ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def _slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def _barangay_record_for_upload(upload: DatasetUpload) -> dict:
    return {
        "id": upload.id,
        "barangay": upload.barangay_name,
        "district": "Pending district",
        "riskLevel": "Moderate",
        "dpi": 0.72,
        "population": 12000,
        "floodDepthM": 1.2,
    }


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


async def create_upload(
    db: Session,
    *,
    account: Account,
    barangay_name: str,
    data_type: str,
    notes: str,
    file: Optional[UploadFile],
) -> UploadPublic:
    file_name = None
    file_path = None

    if file is not None and file.filename:
        upload_dir = _ensure_upload_dir()
        safe_name = Path(file.filename).name
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
        data_type=data_type.strip(),
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


def list_uploads_for_user(db: Session, account_id: int) -> list[UploadPublic]:
    rows = (
        db.query(DatasetUpload)
        .filter(DatasetUpload.uploader_id == account_id)
        .order_by(DatasetUpload.created_at.desc())
        .all()
    )
    return [serialize_upload(row) for row in rows]


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


def get_upload(db: Session, upload_id: int) -> DatasetUpload:
    upload = db.query(DatasetUpload).filter(DatasetUpload.id == upload_id).first()
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")
    return upload


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
                pass
        records.append(_barangay_record_for_upload(row))
    return records
