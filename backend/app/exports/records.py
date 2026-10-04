"""Public-safe export rows: whitelisted fields only, ranked by DPI_Scaled."""

from __future__ import annotations

from app.exports import class_guide
from app.services import barangay_data

# The only fields that may leave the server through a public export, in CSV output order.
# Values are the CSV column headers. Rank is added by the renderers, not selected.
PUBLIC_EXPORT_COLUMNS: dict[str, str] = {
    "barangay": "Barangay",
    "district": "District",
    "area": "Area",
    "dpi_scaled": "DPI_Scaled",
    "priority_class": "Priority_Class",
    "population_2024": "Population_2024",
    "flood_pct_5yr": "Flood_PCT_5yr",
    "flood_pct_25yr": "Flood_PCT_25yr",
    "elevation_mean": "Elevation_Mean",
    "hazard": "Hazard",
    "exposure": "Exposure",
    "vulnerability": "Vulnerability",
    "planning_reference": "Planning_Reference",
    "drrm_pillar": "DRRM_Pillar",
}

MANDATORY_COLUMNS = ("barangay", "dpi_scaled", "priority_class")
PLANNING_COLUMNS = ("planning_reference", "drrm_pillar")

_SOURCE_KEYS = {
    "barangay": "name",
    "district": "district",
    "area": "area",
    "dpi_scaled": "dpi_scaled",
    "priority_class": "risk_category",
    "population_2024": "population_2024",
    "flood_pct_5yr": "flood_pct_5yr",
    "flood_pct_25yr": "flood_pct_25yr",
    "elevation_mean": "elevation_mean",
    "hazard": "hazard",
    "exposure": "exposure",
    "vulnerability": "vulnerability",
}


def ranked_rows() -> list[dict]:
    """Every barangay with only whitelisted fields plus Rank (DPI_Scaled descending, ties by barangay number).

    District and Area come from barangay_data, the shared district/area mapping.
    Planning_Reference and DRRM_Pillar come from the shared class-guide module by priority class.
    """
    records = sorted(
        barangay_data.get_all_barangays(),
        key=lambda record: (-record["dpi_scaled"], record["barangay_no"], record["name"]),
    )
    rows = []
    for rank, record in enumerate(records, start=1):
        row = {"rank": rank, **{key: record[source] for key, source in _SOURCE_KEYS.items()}}
        label = row["priority_class"]
        row["planning_reference"] = class_guide.planning_reference(label)
        row["drrm_pillar"] = class_guide.drrm_pillar(label)
        rows.append(row)
    return rows


def district_short(district: str | None) -> str:
    """"District III" -> "III"."""
    text = (district or "").strip()
    return text[len("District "):] if text.startswith("District ") else text


def place_label(row: dict) -> str:
    """Compact district and area cell, e.g. "III · Santa Cruz"."""
    parts = [district_short(row.get("district")), (row.get("area") or "").strip()]
    return " · ".join(part for part in parts if part)
