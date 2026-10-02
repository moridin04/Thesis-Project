from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies.auth import require_staff_or_admin
from app.schemas.ml_results import MLResultsResponse
from app.services.ml_results import get_ml_results

router = APIRouter(prefix="/ml", tags=["ml"], dependencies=[Depends(require_staff_or_admin)])


@router.get("/results", response_model=MLResultsResponse)
def get_results() -> dict:
    return get_ml_results()
