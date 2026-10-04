# Staff workspace under /api/operations. An admin can call it too.
# require_staff_or_admin is on each route. Visitors cannot call these.
# File uploads go through upload_service and start as pending DatasetUpload rows.
# The submit routes that take no body only write an audit row. They copy a
# permission name into details. The gate on the route is the role, not that name.

from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_staff_or_admin
from app.models.account import Account
# Permission names stored in audit details on the submit routes below.
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


# Pending upload count, the account id, and the role.
# draft_barangay_changes is fixed at 0. There is no draft table behind it.
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


# All published barangay rows from barangay_data, same source as the public list.
# The role check is what keeps this path on the staff side of the API.
@router.get("/barangays")
def operations_barangays(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> list[dict[str, Any]]:
    return barangay_data.get_all_barangays()


# Uploads created by the signed-in account only, newest first.
@router.get("/uploads", response_model=list[UploadPublic])
def list_my_uploads(
    current_account: Annotated[Account, Depends(require_staff_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[UploadPublic]:
    return list_uploads_for_user(db, current_account.id)


# Form upload: barangay name, data type, notes, and an optional file.
# create_upload saves a pending row and writes an upload_submitted audit row.
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


# Published dataset version. drafts is always an empty list.
# This route does not query a drafts table.
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


# Write dataset_submitted and put DATASET_SUBMIT in the details.
# Returns pending_review. It does not insert a dataset row.
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


# Write dataset_upload_draft and put DATASET_UPLOAD in the details.
# Returns draft. The route that stores a file is POST /operations/uploads.
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


# Selected model name and its training cross-validation F1-macro.
# Read from barangay_data. status in the body is always "selected".
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


# Write model_submitted and put MODEL_SUBMIT in the details.
# Returns pending_review. It does not save a new model file.
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


# Placeholder report list. drafts is always empty.
@router.get("/reports")
def operations_reports(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> dict[str, Any]:
    return {"drafts": []}


# Write report_draft_created and put REPORT_PREPARE in the details.
# The PDF file is built by the routes in reports.py, not here.
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


# Placeholder content list. drafts is always empty.
@router.get("/content")
def operations_content(
    _current_account: Annotated[Account, Depends(require_staff_or_admin)],
) -> dict[str, Any]:
    return {"drafts": []}


# Write content_draft_created and put CONTENT_PREPARE in the details.
# Returns draft. Public page text still comes from public_content.py.
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
