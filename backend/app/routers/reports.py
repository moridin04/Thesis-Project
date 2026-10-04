# PDF report routes. Staff and admin download at /api/staff/reports.
# Only an admin can force a rebuild at /api/admin/reports.
# comprehensive_reports caches one PDF per data version. If the source
# files are missing, these routes answer 503. A download is audited with
# the account username. The audit row has no IP or user agent.

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

# Request database session, used when we write the audit row.
DbSession = Annotated[Session, Depends(get_db)]


# What the client sees about the cached PDF: exists or not, version, time, pages, size.
class ReportMeta(BaseModel):
    available: bool
    data_version: str
    generated_at: Optional[datetime] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None


# Turn a missing-input error into 503 so the client knows the PDF cannot be built.
def _missing_inputs(error: MissingReportInput) -> HTTPException:
    return HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Report cannot be generated. {error}")


# Write report_downloaded or report_regenerated. A failed audit write is
# swallowed so the file can still be sent. resource_id is always this report.
# details names the data version. No IP or user agent is included.
def _audit(db: Session, account: Account, action: str, meta: dict) -> None:
    record_audit_log_safely(
        db,
        action=action,
        actor_username=account.username,
        resource_type="report",
        resource_id="comprehensive",
        details=f"Comprehensive report; data version {meta['data_version']}",
    )


# ReportMeta with available true, copied from the cache metadata dict.
def _meta_out(meta: dict) -> ReportMeta:
    return ReportMeta(
        available=True,
        data_version=meta["data_version"],
        generated_at=meta["generated_at"],
        page_count=meta["page_count"],
        file_size=meta["file_size"],
    )


# Staff or admin. Return cache metadata, or available false if it is not built.
# This does not generate the PDF. Missing source files still raise 503.
@staff_router.get("/comprehensive/meta", response_model=ReportMeta)
def comprehensive_report_meta(_account: Annotated[Account, Depends(require_staff_or_admin)]) -> ReportMeta:
    try:
        meta = comprehensive_reports.cached_meta()
        if meta is None:
            return ReportMeta(available=False, data_version=report_data_version())
    except MissingReportInput as error:
        raise _missing_inputs(error) from error
    return _meta_out(meta)


# Staff or admin. Reuse the cached PDF, or build it, then send the file.
# The audit action is report_downloaded.
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


# Admin only. force=True rebuilds the PDF even when a cache file already exists.
# The audit action is report_regenerated. We return metadata, not the file.
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
