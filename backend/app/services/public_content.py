# Static text for the public methodology pages.
# The public router returns these dicts unchanged.
# DPI wording and indicator formulas here are display text for the page.
# METHODOLOGY embeds INDICATORS so that wording lives in one place.
# RECOMMENDATIONS is a short action list for each priority class.

"""Static public content served by read-only endpoints."""

from __future__ import annotations

# Body of /public/indicators. The formulas are page copy, not code that runs.
INDICATORS = {
    "aggregation_note": (
        "The Disaster Prioritization Index (DPI) uses a two-level aggregation: "
        "individual indicators within each component (Hazard, Exposure, Vulnerability) "
        "are normalized and equally averaged into a component score. The three component "
        "scores are then combined using entropy-derived weights to produce the final DPI, "
        "which is used to classify barangays into Low, Medium, and High flood risk priority."
    ),
    "sections": [
        {
            "title": "Hazard Score Indicators",
            "rows": [
                {
                    "indicator": "Flood PCT 5yr",
                    "formula": "(FloodArea_5 / BarangayArea) × 100",
                    "description": "Percentage of barangay area intersecting the 5-year flood-hazard layer",
                },
                {
                    "indicator": "Flood PCT 25yr",
                    "formula": "(FloodArea_25 / BarangayArea) × 100",
                    "description": "Percentage of barangay area intersecting the 25-year flood-hazard layer",
                },
                {
                    "indicator": "Flood Escalation 5to25",
                    "formula": "FloodPCT_25 − FloodPCT_5",
                    "description": "Increase in flood coverage percentage from the 5-year to 25-year scenario",
                },
                {
                    "indicator": "Flood Severity Increase 5to25",
                    "formula": "FloodArea_25 − FloodArea_5 (sqm)",
                    "description": "Increase in flooded land area in square meters",
                },
            ],
        },
        {
            "title": "Exposure Score Indicators",
            "rows": [
                {
                    "indicator": "Affected Population 5yr",
                    "formula": "Population_2024 × FloodPCT_5 / 100",
                    "description": "Estimated population affected under the 5-year flood scenario",
                },
                {
                    "indicator": "Affected Population 25yr",
                    "formula": "Population_2024 × FloodPCT_25 / 100",
                    "description": "Estimated population affected under the 25-year flood scenario",
                },
                {
                    "indicator": "Affected Population Increase 5to25",
                    "formula": "AffectedPop_25 − AffectedPop_5",
                    "description": "Additional population affected between the two scenarios",
                },
            ],
        },
        {
            "title": "Vulnerability Score Indicators",
            "rows": [
                {
                    "indicator": "Population Density (per hectare)",
                    "formula": "Population_2024 / BarangayArea(ha)",
                    "description": "Concentration of residents per hectare",
                },
                {
                    "indicator": "Population Change 2020-2024 (%)",
                    "formula": "((Pop_2024 − Pop_2020) / Pop_2020) × 100",
                    "description": "Recent barangay-level population growth or decline",
                },
                {
                    "indicator": "Elevation_Mean (reverse-normalized)",
                    "formula": "DTM-derived mean elevation, NAMRIA",
                    "description": "Lower elevation corresponds to greater physical susceptibility to flooding",
                },
            ],
        },
        {
            "title": "Identifiers and target",
            "note": "Display and joining fields only. These are not used as machine-learning predictors.",
            "rows": [
                {
                    "indicator": "Barangay",
                    "formula": "Name / label",
                    "description": "Used for joining and display only",
                },
                {
                    "indicator": "PSGC / Barangay code",
                    "formula": "Administrative code",
                    "description": "Used for joining and mapping only",
                },
                {
                    "indicator": "DPI Risk-Priority Class",
                    "formula": "Low / Medium / High tertile",
                    "description": "The tertile-based target label produced by the model",
                },
            ],
        },
    ],
}

# Body of /public/methodology, including the data sources the page names.
METHODOLOGY = {
    "data_sources": ["LiPAD flood-hazard layers", "PSA population 2020 and 2024", "NAMRIA DTM elevation"],
    "preprocessing": "Spatial joins, min-max normalization, and equal averaging within each component.",
    "classification": (
        "Gradient Boosting is the single selected model for all 897 Manila barangays, "
        "chosen by training cross-validation. It is not fit separately per barangay."
    ),
    "dpi_aggregation": INDICATORS["aggregation_note"],
    "indicators": INDICATORS,
    "limitations": (
        "Outputs support planning prioritization. They are not official flood warnings "
        "or forecasts of a specific event."
    ),
}

# Body of /public/recommendations, keyed by Low, Medium, and High.
RECOMMENDATIONS = {
    "High": ["Prioritize evacuation planning", "Coordinate with barangay disaster teams"],
    "Medium": ["Monitor seasonal rainfall advisories", "Update community hazard maps"],
    "Low": ["Maintain drainage assets", "Review shelter capacity"],
}
