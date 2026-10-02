from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import barangay_data
from app.services.ml_results import get_model_summary
from app.services.public_content import INDICATORS, METHODOLOGY, RECOMMENDATIONS
from app.services.upload_service import list_approved_barangay_records

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/approved-barangays")
def get_approved_upload_barangays(
    db: Session = Depends(get_db),
) -> list[dict]:
    return list_approved_barangay_records(db)


@router.get("/overview")
def get_overview() -> dict:
    return barangay_data.get_overview_stats()


@router.get("/barangays")
def list_barangays() -> list[dict]:
    return barangay_data.get_all_barangays()


@router.get("/barangays/{barangay_id}")
def get_barangay(barangay_id: str) -> dict:
    record = barangay_data.get_barangay_by_id(barangay_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barangay not found.")
    return record


@router.get("/rankings")
def get_rankings() -> list[dict]:
    return barangay_data.get_rankings()


@router.get("/indicators")
def get_indicators() -> dict:
    return INDICATORS


@router.get("/methodology")
def get_methodology() -> dict:
    return METHODOLOGY


@router.get("/model-summary")
def get_public_model_summary() -> dict:
    return get_model_summary()


@router.get("/recommendations")
def get_recommendations() -> dict:
    return RECOMMENDATIONS
