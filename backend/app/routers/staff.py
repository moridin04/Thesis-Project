from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import require_staff_or_admin
from app.services import barangay_data

router = APIRouter(prefix="/staff", tags=["staff"], dependencies=[Depends(require_staff_or_admin)])


@router.get("/barangays/ml")
def list_barangay_ml(differs: bool = False) -> list[dict]:
    return barangay_data.list_barangay_ml(differs_only=differs)


@router.get("/barangays/{barangay_id}/ml")
def get_barangay_ml(barangay_id: str) -> dict:
    record = barangay_data.get_barangay_ml(barangay_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barangay not found.")
    return record
