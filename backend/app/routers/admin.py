# Admin routes under /api/admin. Only an active admin can call them.
# require_admin rejects staff with 403. The check is on each route.
# Upload review uses upload_service and the DatasetUpload model.
# Account changes use Account and auth_service.create_account.
# The publish routes below only write an audit row. They do not edit a table.

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Annotated, Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.account import Account
from app.models.upload import DatasetUpload
# Written into audit details. The route gate is still require_admin.
from app.permissions import ACCOUNT_MANAGE, DATASET_PUBLISH
from app.schemas.auth import (
    AccountCreateRequest,
    AccountPublic,
    AccountRoleUpdate,
    AccountStatusUpdate,
)
# The only live roles: "staff" and "admin".
from app.security import ROLE_ADMIN, ROLE_STAFF
from app.services import barangay_data
from app.services import audit_service
from app.services.audit_service import record_audit_log
from app.schemas.upload import UploadPublic, UploadRejectRequest
from app.services.auth_service import create_account
from app.services.upload_service import (
    approve_upload,
    list_uploads,
    reject_upload,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# All dataset uploads for an admin. Optional status narrows the list.
# Returns UploadPublic rows from upload_service, newest first.
@router.get("/uploads", response_model=list[UploadPublic])
def list_all_uploads(
    _current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    status: Optional[str] = None,
) -> list[UploadPublic]:
    return list_uploads(db, status_filter=status)


# Approve one pending upload and store its barangay snapshot.
# upload_service refuses anything that is not still pending, and writes
# an upload_approved audit row. The actor is the admin username.
@router.post("/uploads/{upload_id}/approve", response_model=UploadPublic)
def approve_upload_endpoint(
    upload_id: int,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadPublic:
    return approve_upload(db, upload_id, current_account)


# Reject one pending upload and keep the reason from the body.
# The service clears the barangay snapshot and writes upload_rejected.
@router.post("/uploads/{upload_id}/reject", response_model=UploadPublic)
def reject_upload_endpoint(
    upload_id: int,
    payload: UploadRejectRequest,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadPublic:
    return reject_upload(
        db,
        upload_id,
        current_account,
        rejection_reason=payload.rejection_reason,
    )


# Pending upload count, plus overview and model numbers from barangay_data.
# high_risk_barangays is the High priority count, not a separate query.
@router.get("/dashboard")
def admin_dashboard(
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    pending = (
        db.query(DatasetUpload).filter(DatasetUpload.status == "pending").count()
    )
    overview = barangay_data.get_overview_stats()
    model = barangay_data.get_model_evaluation()
    return {
        "message": "AGOS Administration dashboard",
        "account_id": current_account.id,
        "published_dataset_version": barangay_data.DATASET_VERSION,
        "pending_approvals": pending,
        "high_risk_barangays": overview["high_priority_count"],
        "latest_model_name": model["model_name"],
        "latest_model_f1_macro_cv": model["f1_macro_cv"],
        "latest_model_metric": model["metric"],
    }


# Record dataset_approved for this id. No dataset row is updated.
# The audit row stores the admin username, not an IP or user agent.
@router.post("/datasets/{dataset_id}/approve")
def approve_dataset(
    dataset_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="dataset_approved",
        actor_username=current_account.username,
        resource_type="dataset",
        resource_id=dataset_id,
    )
    return {"message": "Dataset approved.", "status": "approved"}


# Record dataset_published. details includes the DATASET_PUBLISH name
# so the log shows which permission this action stands for.
@router.post("/datasets/{dataset_id}/publish")
def publish_dataset(
    dataset_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="dataset_published",
        actor_username=current_account.username,
        resource_type="dataset",
        resource_id=dataset_id,
        details=f"permission={DATASET_PUBLISH}",
    )
    return {"message": "Dataset published.", "status": "published"}


# Record dataset_archived for this id. No file or row is moved.
@router.post("/datasets/{dataset_id}/archive")
def archive_dataset(
    dataset_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="dataset_archived",
        actor_username=current_account.username,
        resource_type="dataset",
        resource_id=dataset_id,
    )
    return {"message": "Dataset archived.", "status": "archived"}


# Record barangay_published. The id is the string the client sent.
@router.post("/barangays/{barangay_id}/publish")
def publish_barangay(
    barangay_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="barangay_published",
        actor_username=current_account.username,
        resource_type="barangay",
        resource_id=barangay_id,
    )
    return {"message": "Barangay changes published.", "status": "published"}


# Record model_published. This does not replace the saved model files.
@router.post("/models/{model_id}/publish")
def publish_model(
    model_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="model_published",
        actor_username=current_account.username,
        resource_type="model",
        resource_id=model_id,
    )
    return {"message": "Model results published.", "status": "published"}


# Record report_published. The PDF download route lives in reports.py.
@router.post("/reports/{report_id}/publish")
def publish_report(
    report_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="report_published",
        actor_username=current_account.username,
        resource_type="report",
        resource_id=report_id,
    )
    return {"message": "Report published.", "status": "published"}


# Record content_published. Public page text is unchanged by this call.
@router.post("/content/{content_id}/publish")
def publish_content(
    content_id: str,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    record_audit_log(
        db,
        action="content_published",
        actor_username=current_account.username,
        resource_type="content",
        resource_id=content_id,
    )
    return {"message": "Content published.", "status": "published"}


# Admin page of audit rows. group filters by action prefix. date is one
# Asia/Manila calendar day. limit defaults to 50, capped at 200, with offset.
# We return username and details only. No IP or user agent is stored.
@router.get("/audit-logs")
def list_audit_logs(
    _current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    group: Annotated[Optional[Literal["uploads", "exports", "reports", "accounts"]], Query()] = None,
    day: Annotated[Optional[date], Query(alias="date", description="Asia/Manila calendar day")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[dict[str, Any]]:
    """Read-only, newest first. There is deliberately no edit or delete route for audit rows."""
    logs = audit_service.list_audit_logs(db, group=group, day=day, limit=limit, offset=offset)
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_username": log.actor_username,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "created_at": _utc_iso(log.created_at),
        }
        for log in logs
    ]


# ISO string for an audit row's created_at, used by the list above.
def _utc_iso(value: datetime) -> str:
    # SQLite returns naive datetimes; they are stored in UTC.
    return (value if value.tzinfo else value.replace(tzinfo=timezone.utc)).isoformat()


# Every account, oldest id first. AccountPublic leaves the password hash out.
@router.get("/accounts", response_model=list[AccountPublic])
def list_accounts(
    _current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AccountPublic]:
    accounts = db.query(Account).order_by(Account.id.asc()).all()
    return [
        AccountPublic(
            id=a.id,
            username=a.username,
            full_name=a.full_name,
            role=a.role,
            is_active=a.is_active,
            last_login_at=a.last_login_at,
        )
        for a in accounts
    ]


# Create a staff or admin account, then log account_created.
# create_account hashes the password. The hash is not put in the audit details.
@router.post("/accounts", response_model=AccountPublic, status_code=201)
def create_account_endpoint(
    payload: AccountCreateRequest,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AccountPublic:
    created = create_account(
        db,
        username=payload.username,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role,
    )
    # details holds the new role and the ACCOUNT_MANAGE name, not the password.
    record_audit_log(
        db,
        action="account_created",
        actor_username=current_account.username,
        resource_type="account",
        resource_id=str(created.id),
        details=f"role={created.role};permission={ACCOUNT_MANAGE}",
    )
    return created


# Switch an account between staff and admin. Any other role string is 400.
# We refuse to demote the last active admin, so someone can still sign in.
@router.patch("/accounts/{account_id}/role", response_model=AccountPublic)
def update_account_role(
    account_id: int,
    payload: AccountRoleUpdate,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AccountPublic:
    target = db.query(Account).filter(Account.id == account_id).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    if payload.role not in {ROLE_STAFF, ROLE_ADMIN}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role.")

    # Only an active admin counts. An inactive admin can still be demoted.
    if target.role == ROLE_ADMIN and payload.role != ROLE_ADMIN:
        admin_count = (
            db.query(Account)
            .filter(Account.role == ROLE_ADMIN, Account.is_active.is_(True))
            .count()
        )
        if admin_count <= 1 and target.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the final active administrator.",
            )

    target.role = payload.role
    db.commit()
    db.refresh(target)
    record_audit_log(
        db,
        action="account_role_updated",
        actor_username=current_account.username,
        resource_type="account",
        resource_id=str(target.id),
        details=f"role={payload.role}",
    )
    return AccountPublic(
        id=target.id,
        username=target.username,
        full_name=target.full_name,
        role=target.role,
        is_active=target.is_active,
        last_login_at=target.last_login_at,
    )


# Turn an account on or off. The row stays. Deactivating the last active
# admin is refused, for the same reason as demotion above.
@router.patch("/accounts/{account_id}/status", response_model=AccountPublic)
def update_account_status(
    account_id: int,
    payload: AccountStatusUpdate,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AccountPublic:
    target = db.query(Account).filter(Account.id == account_id).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    if target.is_active and not payload.is_active and target.role == ROLE_ADMIN:
        admin_count = (
            db.query(Account)
            .filter(Account.role == ROLE_ADMIN, Account.is_active.is_(True))
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the final active administrator.",
            )

    target.is_active = payload.is_active
    db.commit()
    db.refresh(target)
    record_audit_log(
        db,
        action="account_status_updated",
        actor_username=current_account.username,
        resource_type="account",
        resource_id=str(target.id),
        details=f"is_active={payload.is_active}",
    )
    return AccountPublic(
        id=target.id,
        username=target.username,
        full_name=target.full_name,
        role=target.role,
        is_active=target.is_active,
        last_login_at=target.last_login_at,
    )
