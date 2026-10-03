from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.services import barangay_data

EXISTING_FIELDS = [
    "id",
    "barangay_no",
    "name",
    "district",
    "population_2020",
    "population_2024",
    "population_density_per_hectare",
    "population_change_2020_2024_pct",
    "elevation_mean",
    "flood_pct_5yr",
    "flood_pct_25yr",
    "hazard",
    "exposure",
    "vulnerability",
    "dpi",
    "dpi_scaled",
    "priority_score",
    "risk_category",
    "dpi_rank",
    "planning_reference",
    "drrm_pillar",
    "image_url",
]


@pytest.mark.parametrize(
    ("barangay_id", "area"),
    [
        ("Barangay%20310", "Santa Cruz"),
        ("Barangay%20628", "Sampaloc"),
        ("Barangay%20649", "Port Area"),
        ("Barangay%20818", "Paco"),
        ("Barangay%20818-A", "Santa Ana"),
        ("Barangay%20664", "Ermita"),
        ("Barangay%20664-A", "Paco"),
    ],
)
def test_detail_returns_area_by_barangay_name(client: TestClient, barangay_id: str, area: str):
    response = client.get(f"/api/public/barangays/{barangay_id}")
    assert response.status_code == 200
    assert response.json()["area"] == area


@pytest.mark.parametrize("path", ["/api/public/barangays", "/api/public/rankings"])
def test_all_897_barangays_have_an_area(client: TestClient, path: str):
    rows = client.get(path).json()
    assert len(rows) == 897
    assert all(isinstance(row["area"], str) and row["area"].strip() for row in rows)


@pytest.mark.parametrize("path", ["/api/public/barangays", "/api/public/rankings"])
def test_existing_fields_and_order_unchanged(client: TestClient, path: str):
    rows = client.get(path).json()
    assert all(list(row) == [*EXISTING_FIELDS, "area"] for row in rows)
    assert [row["dpi_rank"] for row in rows] == sorted(row["dpi_rank"] for row in rows)
    top = rows[0]
    assert (top["id"], top["district"], top["dpi_rank"], top["priority_score"]) == (
        "Barangay 310",
        "District III",
        1,
        100.0,
    )


def test_detail_matches_listing_record(client: TestClient):
    listing = {row["id"]: row for row in client.get("/api/public/barangays").json()}
    detail = client.get("/api/public/barangays/Barangay%20818-A").json()
    assert detail == listing["Barangay 818-A"]
    assert list(detail) == [*EXISTING_FIELDS, "area"]


def test_missing_area_returns_null(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(barangay_data, "_areas", lambda: {})
    row = barangay_data._frame().iloc[0]
    assert barangay_data._record(row)["area"] is None


def test_area_mapping_rejects_duplicate_names(monkeypatch: pytest.MonkeyPatch, tmp_path):
    path = tmp_path / "areas.csv"
    pd.DataFrame({"Barangay": ["Barangay 1", "Barangay 1"], "Area": ["Tondo I / II", "Paco"]}).to_csv(
        path, index=False
    )
    monkeypatch.setattr(barangay_data, "AREA_CSV", path)
    barangay_data._areas.cache_clear()
    try:
        with pytest.raises(ValueError, match="Barangay 1"):
            barangay_data._areas()
    finally:
        barangay_data._areas.cache_clear()
