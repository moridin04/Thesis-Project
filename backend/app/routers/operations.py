from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_staff_or_admin
from app.models.account import Account
from app.permissions import (
    CONTENT_PREPARE,
    DATASET_SUBMIT,
    DATASET_UPLOAD,
    MODEL_SUBMIT,
    REPORT_PREPARE,
)
from app.schemas.upload import UploadPublic
from app.models.upload import DatasetUpload
from app.services import barangay_data
from app.services.audit_service import record_audit_log
from app.services.upload_service import create_upload, list_uploads_for_user

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/dashboard")
def operations_dashboard(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    pending = (
        db.query(DatasetUpload).filter(DatasetUpload.status == "pending").count()
    )
    return {
        "message": "AGOS operational dashboard",
        "account_id": current_account.id,
        "role": current_account.role,
        "published_dataset_version": barangay_data.DATASET_VERSION,
        "pending_submissions": pending,
        "draft_barangay_changes": 0,
    }


@router.get("/barangays")
def operations_barangays(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> list[dict[str, Any]]:
    return barangay_data.get_all_barangays()


@router.get("/uploads", response_model=list[UploadPublic])
def list_my_uploads(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[UploadPublic]:
    return list_uploads_for_user(db, current_account.id)


@router.post("/uploads", response_model=UploadPublic, status_code=201)
async def submit_upload(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    barangay_name: Annotated[str, Form()],
    data_type: Annotated[str, Form()],
    notes: Annotated[str, Form()] = "",
    file: Annotated[Optional[UploadFile], File()] = None,
) -> UploadPublic:
    return await create_upload(
        db,
        account=current_account,
        barangay_name=barangay_name,
        data_type=data_type,
        notes=notes,
        file=file,
    )


@router.get("/datasets")
def operations_datasets(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> dict[str, Any]:
    return {
        "published": {
            "version": barangay_data.DATASET_VERSION,
            "status": "published",
        },
        "drafts": [],
    }


@router.post("/dataset-submissions")
def submit_dataset(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="dataset_submitted",
        actor_username=current_account.username,
        resource_type="dataset",
        details=f"permission={DATASET_SUBMIT}",
    )
    return {"message": "Dataset submission recorded as pending_review.", "status": "pending_review"}


@router.post("/dataset-uploads")
def upload_dataset_draft(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="dataset_upload_draft",
        actor_username=current_account.username,
        resource_type="dataset",
        details=f"permission={DATASET_UPLOAD}",
    )
    return {"message": "Dataset draft uploaded.", "status": "draft"}


@router.get("/model-results")
def operations_model_results(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> dict[str, Any]:
    model = barangay_data.get_model_evaluation()
    return {
        "model_name": model["model_name"],
        "f1_macro_cv": model["f1_macro_cv"],
        "metric": model["metric"],
        "status": "selected",
    }


@router.post("/model-submissions")
def submit_model(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="model_submitted",
        actor_username=current_account.username,
        resource_type="model",
        details=f"permission={MODEL_SUBMIT}",
    )
    return {"message": "Model results submitted for review.", "status": "pending_review"}


@router.get("/reports")
def operations_reports(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> dict[str, Any]:
    return {"drafts": []}


@router.post("/report-drafts")
def create_report_draft(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="report_draft_created",
        actor_username=current_account.username,
        resource_type="report",
        details=f"permission={REPORT_PREPARE}",
    )
    return {"message": "Report draft created.", "status": "draft"}


@router.get("/content")
def operations_content(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> dict[str, Any]:
    return {"drafts": []}


@router.post("/content-drafts")
def create_content_draft(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="content_draft_created",
        actor_username=current_account.username,
        resource_type="content",
        details=f"permission={CONTENT_PREPARE}",
    )
    return {"message": "Content draft created.", "status": "draft"}
