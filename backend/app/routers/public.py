# Public read-only routes under /api/public. No login is required.
# Barangay figures come from barangay_data, the published dataset.
# Indicator text, methodology, and recommendations are constants in
# public_content.py. Approved upload snapshots come from upload_service.
# Model class predictions are not here. Those stay on /api/staff.

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import barangay_data
from app.services.ml_results import get_model_summary
from app.services.public_content import INDICATORS, METHODOLOGY, RECOMMENDATIONS
from app.services.upload_service import list_approved_barangay_records

router = APIRouter(prefix="/public", tags=["public"])


# Barangay snapshots saved when an admin approved an upload.
# Only rows with status approved are included.
@router.get("/approved-barangays")
def get_approved_upload_barangays(
    db: Session = Depends(get_db),
) -> list[dict]:
    return list_approved_barangay_records(db)


# City-wide counts by Low, Medium, and High, plus the exposed population.
@router.get("/overview")
def get_overview() -> dict:
    return barangay_data.get_overview_stats()


# Every barangay in the published dataset, ordered by DPI rank.
@router.get("/barangays")
def list_barangays() -> list[dict]:
    return barangay_data.get_all_barangays()


# One barangay by the name used as its id. Unknown names return 404.
@router.get("/barangays/{barangay_id}")
def get_barangay(barangay_id: str) -> dict:
    record = barangay_data.get_barangay_by_id(barangay_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barangay not found.")
    return record


# Same list as /barangays. get_rankings returns get_all_barangays.
@router.get("/rankings")
def get_rankings() -> list[dict]:
    return barangay_data.get_rankings()


# Static DPI indicator text from public_content.INDICATORS.
@router.get("/indicators")
def get_indicators() -> dict:
    return INDICATORS


# Static methodology text from public_content.METHODOLOGY.
@router.get("/methodology")
def get_methodology() -> dict:
    return METHODOLOGY


# Short public model card: selected model and held-out correct count.
# The full tables are on /api/ml/results, and that route requires a role.
@router.get("/model-summary")
def get_public_model_summary() -> dict:
    return get_model_summary()


# Static recommendation text from public_content.RECOMMENDATIONS.
@router.get("/recommendations")
def get_recommendations() -> dict:
    return RECOMMENDATIONS
