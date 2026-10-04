"""Priority Class Guide shared by the public CSV and HTML report.

Wording is condensed from the pipeline's Planning_Reference and DRRM_Pillar columns
(src/ML-thesis-updated/Output/barangay_flood_risk_predictions.csv); it adds no new claims.
Keep this the only copy: both renderers read it from here.
"""

from __future__ import annotations

from collections.abc import Iterable

DPI_NAME = "Disaster Prioritization Index"
CLASS_ORDER = ("High", "Medium", "Low")
TERTILE_NOTE = "Priority classes are relative tertiles across Manila barangays."

PILLAR_SHORT = {
    "Disaster Prevention and Mitigation": "Prevention",
    "Disaster Preparedness": "Preparedness",
    "Disaster Response and Early Recovery": "Response",
}

CLASS_GUIDE: dict[str, dict] = {
    "High": {
        "pillars": [
            "Disaster Prevention and Mitigation",
            "Disaster Preparedness",
            "Disaster Response and Early Recovery",
        ],
        "actions": [
            "Priority site validation",
            "Detailed evacuation planning",
            "Pre-positioning review",
            "Infrastructure assessment",
            "Enhanced preparedness review",
        ],
        "summary": "site validation, evacuation planning, pre-positioning, infrastructure",
    },
    "Medium": {
        "pillars": ["Disaster Prevention and Mitigation", "Disaster Preparedness"],
        "actions": [
            "Periodic drainage and waterway clearing",
            "More frequent early-warning checks",
            "Community drills",
            "Relief-stock review",
            "Evacuation-route verification",
        ],
        "summary": "drainage clearing, early-warning checks, drills, relief stock, evacuation routes",
    },
    "Low": {
        "pillars": ["Disaster Prevention and Mitigation", "Disaster Preparedness"],
        "actions": [
            "Routine monitoring",
            "Drainage inspection",
            "Annual information updating",
            "Regular drills",
        ],
        "summary": "routine monitoring, drainage inspection, annual updates, drills",
    },
}


def class_ranges(rows: Iterable[dict]) -> dict[str, tuple[float, float]]:
    """(min, max) DPI_Scaled per class, from the same records the export lists."""
    ranges: dict[str, tuple[float, float]] = {}
    for row in rows:
        label, value = row["priority_class"], row["dpi_scaled"]
        low, high = ranges.get(label, (value, value))
        ranges[label] = (min(low, value), max(high, value))
    return ranges


def range_text(bounds: tuple[float, float] | None) -> str:
    return "" if bounds is None else f"DPI {bounds[0]:.2f} to {bounds[1]:.2f}"


def short_pillars(label: str) -> str:
    return ", ".join(PILLAR_SHORT[p] for p in CLASS_GUIDE[label]["pillars"])


def csv_guide_lines(ranges: dict[str, tuple[float, float]]) -> list[str]:
    """One line per class, e.g. "High (DPI 22.93 to 100.00): pillars ...; planning: ..."."""
    return [
        f"{label} ({range_text(ranges.get(label))}): pillars {short_pillars(label)}; "
        f"planning: {CLASS_GUIDE[label]['summary']}"
        for label in CLASS_ORDER
    ]
