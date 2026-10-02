from __future__ import annotations

from fastapi import APIRouter

from app.schemas.ml_results import MLResultsResponse
from app.services.ml_results import get_ml_results

router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/results", response_model=MLResultsResponse)
def get_results() -> dict:
    return get_ml_results()
