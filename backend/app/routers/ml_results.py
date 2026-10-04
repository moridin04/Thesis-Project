# Staff and admin model results under /api/ml.
# require_staff_or_admin is on the router, so every route needs that role.
# The numbers come from services/ml_results.py, which reads saved pipeline CSVs.
# Visitors use /api/public/model-summary, which returns a much smaller card.

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies.auth import require_staff_or_admin
from app.schemas.ml_results import MLResultsResponse
from app.services.ml_results import get_ml_results

router = APIRouter(prefix="/ml", tags=["ml"], dependencies=[Depends(require_staff_or_admin)])


# Full comparison, importance, and confusion data for the signed-in staff view.
# get_ml_results caches the file read. The body matches MLResultsResponse.
@router.get("/results", response_model=MLResultsResponse)
def get_results() -> dict:
    return get_ml_results()
