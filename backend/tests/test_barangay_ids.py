from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.services import barangay_data


def test_parent_and_suffixed_barangays_are_distinct(client: TestClient):
    parent = client.get("/api/public/barangays/Barangay%20659")
    suffixed = client.get("/api/public/barangays/Barangay%20659-A")
    assert parent.status_code == 200
    assert suffixed.status_code == 200
    assert parent.json()["id"] == "Barangay 659"
    assert suffixed.json()["id"] == "Barangay 659-A"
    assert parent.json()["barangay_no"] == suffixed.json()["barangay_no"] == 659
    assert parent.json()["dpi_rank"] != suffixed.json()["dpi_rank"]


def test_url_encoded_id_with_space_resolves(client: TestClient):
    response = client.get("/api/public/barangays/Barangay%20310")
    assert response.status_code == 200
    assert response.json()["name"] == "Barangay 310"


@pytest.mark.parametrize("barangay_id", ["Barangay%209999", "659", "barangay%20659"])
def test_unknown_id_returns_404(client: TestClient, barangay_id: str):
    assert client.get(f"/api/public/barangays/{barangay_id}").status_code == 404


def test_uniqueness_check_rejects_duplicate_barangay():
    frame = pd.DataFrame({"Barangay": ["Barangay 1", "Barangay 2", "Barangay 1"]})
    with pytest.raises(ValueError, match="Barangay 1"):
        barangay_data.validate_barangay_keys(frame)


def test_uniqueness_check_rejects_blank_barangay():
    frame = pd.DataFrame({"Barangay": ["Barangay 1", " ", None]})
    with pytest.raises(ValueError, match="non-empty"):
        barangay_data.validate_barangay_keys(frame)


def test_real_csv_has_897_unique_barangays():
    frame = barangay_data._frame()
    assert len(frame) == 897
    assert frame["Barangay"].nunique() == 897
    assert frame["District"].notna().all()


def test_priority_score_equals_dpi_scaled(client: TestClient):
    record = client.get("/api/public/barangays/Barangay%20649").json()
    expected = barangay_data._frame().set_index("Barangay").loc["Barangay 649", "DPI_Scaled"]
    assert record["priority_score"] == pytest.approx(expected, abs=1e-6)
    assert record["priority_score"] == record["dpi_scaled"]
