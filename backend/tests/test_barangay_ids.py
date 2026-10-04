# The public barangay id is the name, including suffixes.
# Covers validate_barangay_keys and get_barangay_by_id in barangay_data.
# A parent and a suffixed name share a number and stay two records.
# A bare number or the wrong case is 404. Blank or duplicate names
# must fail the CSV load.

from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.services import barangay_data


# Barangay 659 and Barangay 659-A are two records. They share a number,
# and their DPI ranks differ.
def test_parent_and_suffixed_barangays_are_distinct(client: TestClient):
    parent = client.get("/api/public/barangays/Barangay%20659")
    suffixed = client.get("/api/public/barangays/Barangay%20659-A")
    assert parent.status_code == 200
    assert suffixed.status_code == 200
    assert parent.json()["id"] == "Barangay 659"
    assert suffixed.json()["id"] == "Barangay 659-A"
    assert parent.json()["barangay_no"] == suffixed.json()["barangay_no"] == 659
    assert parent.json()["dpi_rank"] != suffixed.json()["dpi_rank"]


# A percent-encoded space in the path still resolves to the barangay name.
def test_url_encoded_id_with_space_resolves(client: TestClient):
    response = client.get("/api/public/barangays/Barangay%20310")
    assert response.status_code == 200
    assert response.json()["name"] == "Barangay 310"


# An unknown name, a bare number, and a lowercased name each return 404.
@pytest.mark.parametrize("barangay_id", ["Barangay%209999", "659", "barangay%20659"])
def test_unknown_id_returns_404(client: TestClient, barangay_id: str):
    assert client.get(f"/api/public/barangays/{barangay_id}").status_code == 404


# Repeated Barangay values cannot be the record key.
def test_uniqueness_check_rejects_duplicate_barangay():
    frame = pd.DataFrame({"Barangay": ["Barangay 1", "Barangay 2", "Barangay 1"]})
    with pytest.raises(ValueError, match="Barangay 1"):
        barangay_data.validate_barangay_keys(frame)


# A blank or null Barangay value cannot be the record key.
def test_uniqueness_check_rejects_blank_barangay():
    frame = pd.DataFrame({"Barangay": ["Barangay 1", " ", None]})
    with pytest.raises(ValueError, match="non-empty"):
        barangay_data.validate_barangay_keys(frame)


# The predictions file has 897 names, all unique, and every district is filled.
def test_real_csv_has_897_unique_barangays():
    frame = barangay_data._frame()
    assert len(frame) == 897
    assert frame["Barangay"].nunique() == 897
    assert frame["District"].notna().all()


# High, Medium, and Low samples include a planning reference and a DRRM pillar.
@pytest.mark.parametrize(
    ("barangay_id", "risk_category"),
    [("Barangay%20310", "High"), ("Barangay%20246", "Medium"), ("Barangay%20685", "Low")],
)
def test_planning_reference_and_drrm_pillar_present(
    client: TestClient, barangay_id: str, risk_category: str
):
    record = client.get(f"/api/public/barangays/{barangay_id}").json()
    assert record["risk_category"] == risk_category
    for field in ("planning_reference", "drrm_pillar"):
        assert isinstance(record[field], str)
        assert record[field].strip()


# priority_score copies DPI_Scaled from the predictions file.
def test_priority_score_equals_dpi_scaled(client: TestClient):
    record = client.get("/api/public/barangays/Barangay%20649").json()
    expected = barangay_data._frame().set_index("Barangay").loc["Barangay 649", "DPI_Scaled"]
    assert record["priority_score"] == pytest.approx(expected, abs=1e-6)
    assert record["priority_score"] == record["dpi_scaled"]
