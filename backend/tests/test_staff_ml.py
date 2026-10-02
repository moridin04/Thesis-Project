from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from tests.conftest import admin_account, client, staff_account

ML_ENDPOINT = "/api/staff/barangays/Barangay 310/ml"
ML_FIELD_MARKERS = ("ml_predicted", "ml_prediction", "prediction_confidence", "best_model")
PUBLIC_GET_PATHS = [
    "/api/public/overview",
    "/api/public/barangays",
    "/api/public/barangays/Barangay 310",
    "/api/public/rankings",
    "/api/public/indicators",
    "/api/public/methodology",
    "/api/public/model-summary",
    "/api/public/recommendations",
    "/api/public/approved-barangays",
]


def _auth(client: TestClient, username: str, password: str) -> dict:
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.mark.parametrize("path", [ML_ENDPOINT, "/api/staff/barangays/ml"])
def test_staff_ml_requires_authentication(client: TestClient, path: str):
    assert client.get(path).status_code == 401


def test_staff_can_read_ml_prediction(client: TestClient, staff_account):
    response = client.get(ML_ENDPOINT, headers=_auth(client, "staff01", "StaffPass1234"))
    assert response.status_code == 200
    body = response.json()
    assert body["dpi_risk_class"] == "High"
    assert body["ml_predicted_risk_class"] in {"Low", "Medium", "High"}
    assert 0 <= body["ml_prediction_confidence"] <= 1
    assert body["agrees_with_dpi"] == (body["ml_predicted_risk_class"] == body["dpi_risk_class"])


def test_admin_can_read_ml_prediction(client: TestClient, admin_account):
    response = client.get(ML_ENDPOINT, headers=_auth(client, "agos_admin", "AdminPass1234"))
    assert response.status_code == 200
    assert response.json()["id"] == "Barangay 310"


def test_staff_ml_unknown_barangay_is_404(client: TestClient, staff_account):
    response = client.get(
        "/api/staff/barangays/Not a barangay/ml", headers=_auth(client, "staff01", "StaffPass1234")
    )
    assert response.status_code == 404


def test_staff_differs_filter(client: TestClient, staff_account):
    headers = _auth(client, "staff01", "StaffPass1234")
    everything = client.get("/api/staff/barangays/ml", headers=headers).json()
    differs = client.get("/api/staff/barangays/ml?differs=true", headers=headers).json()
    assert len(everything) == 897
    assert differs == [row for row in everything if not row["agrees_with_dpi"]]


@pytest.mark.parametrize("path", PUBLIC_GET_PATHS)
def test_public_endpoints_expose_no_ml_fields(client: TestClient, path: str):
    response = client.get(path)
    assert response.status_code == 200
    payload = json.dumps(response.json()).lower()
    for marker in ML_FIELD_MARKERS:
        assert marker not in payload, f"{path} exposes {marker}"
