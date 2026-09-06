from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.account import Account
from app.permissions import ACCOUNT_MANAGE, DATASET_PUBLISH
from app.schemas.auth import (
    AccountCreateRequest,
    AccountPublic,
    AccountRoleUpdate,
    AccountStatusUpdate,
)
from app.security import ROLE_ADMIN, ROLE_STAFF
from app.services.audit_service import record_audit_log
from app.schemas.upload import UploadPublic, UploadRejectRequest
from app.services.auth_service import create_account
from app.services.upload_service import (
    approve_upload,
    list_uploads,
    reject_upload,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/uploads", response_model=list[UploadPublic])
def list_all_uploads(
    _current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    status: Optional[str] = None,
) -> list[UploadPublic]:
    return list_uploads(db, status_filter=status)


@router.post("/uploads/{upload_id}/approve", response_model=UploadPublic)
def approve_upload_endpoint(
    upload_id: int,
    current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadPublic:
    return approve_upload(db, upload_id, current_account)


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


@router.get("/dashboard")
def admin_dashboard(
    current_account: Annotated[Account, Depends(require_admin)],
) -> dict[str, Any]:
    return {
        "message": "SAGIP Administration dashboard",
        "account_id": current_account.id,
        "published_dataset_version": "2026.1-mock",
        "pending_approvals": 2,
        "high_risk_barangays": 142,
        "latest_model_f1": 0.912,
    }


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


@router.get("/audit-logs")
def list_audit_logs(
    _current_account: Annotated[Account, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict[str, Any]]:
    from app.models.audit_log import AuditLog

    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_username": log.actor_username,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


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
    record_audit_log(
        db,
        action="account_created",
        actor_username=current_account.username,
        resource_type="account",
        resource_id=str(created.id),
        details=f"role={created.role};permission={ACCOUNT_MANAGE}",
    )
    return created


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
