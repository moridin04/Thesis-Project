from __future__ import annotations

from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin, require_staff_or_admin
from app.models.account import Account
from app.reports.comprehensive_report import MissingReportInput, report_data_version
from app.services import comprehensive_reports
from app.services.audit_service import record_audit_log_safely

staff_router = APIRouter(prefix="/staff/reports", tags=["staff", "reports"])
admin_router = APIRouter(prefix="/admin/reports", tags=["admin", "reports"])

DbSession = Annotated[Session, Depends(get_db)]


class ReportMeta(BaseModel):
    available: bool
    data_version: str
    generated_at: Optional[datetime] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None


def _missing_inputs(error: MissingReportInput) -> HTTPException:
    return HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Report cannot be generated. {error}")


def _audit(db: Session, account: Account, action: str, meta: dict) -> None:
    record_audit_log_safely(
        db,
        action=action,
        actor_username=account.username,
        resource_type="report",
        resource_id="comprehensive",
        details=f"Comprehensive report; data version {meta['data_version']}",
    )


def _meta_out(meta: dict) -> ReportMeta:
    return ReportMeta(
        available=True,
        data_version=meta["data_version"],
        generated_at=meta["generated_at"],
        page_count=meta["page_count"],
        file_size=meta["file_size"],
    )


@staff_router.get("/comprehensive/meta", response_model=ReportMeta)
def comprehensive_report_meta(_account: Annotated[Account, Depends(require_staff_or_admin)]) -> ReportMeta:
    try:
        meta = comprehensive_reports.cached_meta()
        if meta is None:
            return ReportMeta(available=False, data_version=report_data_version())
    except MissingReportInput as error:
        raise _missing_inputs(error) from error
    return _meta_out(meta)


@staff_router.get("/comprehensive")
def download_comprehensive_report(
    account: Annotated[Account, Depends(require_staff_or_admin)], db: DbSession
) -> FileResponse:
    try:
        path, meta, _built = comprehensive_reports.get_or_build()
    except MissingReportInput as error:
        raise _missing_inputs(error) from error
    _audit(db, account, "report_downloaded", meta)
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=comprehensive_reports.download_filename(meta),
    )


@admin_router.post("/comprehensive/regenerate", response_model=ReportMeta)
def regenerate_comprehensive_report(
    account: Annotated[Account, Depends(require_admin)], db: DbSession
) -> ReportMeta:
    try:
        _path, meta, _built = comprehensive_reports.get_or_build(force=True)
    except MissingReportInput as error:
        raise _missing_inputs(error) from error
    _audit(db, account, "report_regenerated", meta)
    return _meta_out(meta)
