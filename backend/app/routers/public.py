from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.public_data import (
    BARANGAYS,
    INDICATORS,
    METHODOLOGY,
    OVERVIEW,
    RECOMMENDATIONS,
    RISK_DISTRIBUTION,
)
from app.services.upload_service import list_approved_barangay_records

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/approved-barangays")
def get_approved_upload_barangays(
    db: Session = Depends(get_db),
) -> list[dict]:
    return list_approved_barangay_records(db)


@router.get("/overview")
def get_overview() -> dict:
    return {
        **OVERVIEW,
        "risk_distribution": RISK_DISTRIBUTION,
        "priority_barangays": sorted(
            BARANGAYS, key=lambda item: item["risk_score"], reverse=True
        )[:5],
    }


@router.get("/barangays")
def list_barangays() -> list[dict]:
    return BARANGAYS


@router.get("/barangays/{barangay_id}")
def get_barangay(barangay_id: str) -> dict:
    for barangay in BARANGAYS:
        if barangay["id"] == barangay_id:
            return barangay
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barangay not found.")


@router.get("/rankings")
def get_rankings() -> list[dict]:
    return sorted(BARANGAYS, key=lambda item: item["risk_score"], reverse=True)


@router.get("/indicators")
def get_indicators() -> list[dict]:
    return INDICATORS


@router.get("/methodology")
def get_methodology() -> dict:
    return METHODOLOGY


@router.get("/recommendations")
def get_recommendations() -> dict:
    return RECOMMENDATIONS
