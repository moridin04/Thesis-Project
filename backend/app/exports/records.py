"""Public-safe export rows: whitelisted fields only, ranked by DPI_Scaled."""

from __future__ import annotations

from app.services import barangay_data

# The only fields that may leave the server through a public export, in output order.
# Values are the CSV column headers.
PUBLIC_EXPORT_COLUMNS: dict[str, str] = {
    "barangay": "Barangay",
    "district": "District",
    "area": "Area",
    "hazard": "Hazard",
    "exposure": "Exposure",
    "vulnerability": "Vulnerability",
    "dpi_scaled": "DPI_Scaled",
    "priority_class": "Priority_Class",
}

_SOURCE_KEYS = {
    "barangay": "name",
    "district": "district",
    "area": "area",
    "hazard": "hazard",
    "exposure": "exposure",
    "vulnerability": "vulnerability",
    "dpi_scaled": "dpi_scaled",
    "priority_class": "risk_category",
}


def ranked_rows() -> list[dict]:
    """Every barangay with only whitelisted fields plus Rank (DPI_Scaled descending, ties by barangay number).

    District and Area come from barangay_data, the shared district/area mapping.
    """
    records = sorted(
        barangay_data.get_all_barangays(),
        key=lambda record: (-record["dpi_scaled"], record["barangay_no"], record["name"]),
    )
    return [
        {"rank": rank, **{key: record[source] for key, source in _SOURCE_KEYS.items()}}
        for rank, record in enumerate(records, start=1)
    ]


def district_short(district: str | None) -> str:
    """"District III" -> "III"."""
    text = (district or "").strip()
    return text[len("District "):] if text.startswith("District ") else text


def place_label(row: dict) -> str:
    """Compact district and area cell, e.g. "III · Santa Cruz"."""
    parts = [district_short(row.get("district")), (row.get("area") or "").strip()]
    return " · ".join(part for part in parts if part)
