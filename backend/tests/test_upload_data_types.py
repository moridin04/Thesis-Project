# Which data_type values a staff upload may use.
# Covers VALID_DATA_TYPES in app.services.upload_service.
# New submissions must use that list. Unknown text is rejected and not saved.
# A row saved earlier with free text is still listed.

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.upload import DatasetUpload
from app.services.upload_service import VALID_DATA_TYPES
from tests.conftest import client, staff_account


def _staff_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"username": "staff01", "password": "StaffPass1234"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# The allowed values are the project datasets, plus other.
def test_valid_data_types_are_the_project_datasets():
    assert VALID_DATA_TYPES == (
        "flood_hazard_5yr",
        "flood_hazard_25yr",
        "elevation_dtm",
        "population",
        "barangay_boundaries",
        "other",
    )


# Each allowed data_type is accepted and returned on the created row.
@pytest.mark.parametrize("data_type", VALID_DATA_TYPES)
def test_submit_accepts_each_valid_data_type(client: TestClient, staff_account, data_type: str):
    response = client.post(
        "/api/operations/uploads",
        headers=_staff_headers(client),
        data={"barangay_name": "Barangay 310", "data_type": data_type},
    )
    assert response.status_code == 201
    assert response.json()["data_type"] == data_type


# Free text, a near miss, a blank, and the wrong case are 422.
# Those requests do not insert an upload row.
@pytest.mark.parametrize("data_type", ["Flood depth", "flood_depth", "", "FLOOD_HAZARD_5YR"])
def test_submit_rejects_unknown_data_type(
    client: TestClient, db_session: Session, staff_account, data_type: str
):
    response = client.post(
        "/api/operations/uploads",
        headers=_staff_headers(client),
        data={"barangay_name": "Barangay 310", "data_type": data_type},
    )
    assert response.status_code == 422
    assert db_session.query(DatasetUpload).count() == 0


# A row saved earlier with free-text data_type is still returned by the list.
def test_legacy_free_text_data_type_is_still_listed(client: TestClient, db_session: Session, staff_account):
    db_session.add(
        DatasetUpload(
            uploader_id=staff_account.id,
            uploader_name="Staff User",
            barangay_name="Barangay 310",
            data_type="Flood depth",
            status="pending",
        )
    )
    db_session.commit()
    response = client.get("/api/operations/uploads", headers=_staff_headers(client))
    assert response.status_code == 200
    assert [row["data_type"] for row in response.json()] == ["Flood depth"]
