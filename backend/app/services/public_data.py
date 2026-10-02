# DEPRECATED — superseded by barangay_data.py
from __future__ import annotations

"""Published public data served by read-only endpoints."""

OVERVIEW = {
    "system_name": "AGOS Manila",
    "acronym": "Analytics and Geospatial Overview for Safety",
    "formal_title": (
        "AGOS: A Barangay-Level Flood Risk Mapping and Disaster Prioritization "
        "System for the City of Manila"
    ),
    "dataset_version": "2026.1-mock",
    "last_updated": "2026-08-22",
    "disclaimer": (
        "AGOS is a planning and decision-support prototype. It does not provide "
        "real-time flood warnings or replace official emergency advisories."
    ),
    "total_barangays": 897,
    "high_risk_count": 142,
    "moderate_risk_count": 287,
    "estimated_exposed_population": 1_284_500,
}

BARANGAYS = [
    {
        "id": "baseco-compound",
        "name": "Baseco Compound",
        "district": "Port Area",
        "risk_score": 0.94,
        "risk_category": "High",
        "population": 62400,
        "estimated_exposure": 58200,
        "hazard_indicators": {"flood_depth_m": 2.8, "rainfall_index": 0.91},
        "vulnerability_indicators": {"density_index": 0.88, "poverty_index": 0.86},
        "contributing_factors": ["Low elevation", "High population density"],
        "recommendations": ["Pre-position evacuation support", "Clear drainage corridors"],
    },
    {
        "id": "barangay-1",
        "name": "Barangay 1",
        "district": "Tondo",
        "risk_score": 0.91,
        "risk_category": "High",
        "population": 41200,
        "estimated_exposure": 36800,
        "hazard_indicators": {"flood_depth_m": 2.5, "rainfall_index": 0.89},
        "vulnerability_indicators": {"density_index": 0.9, "poverty_index": 0.84},
        "contributing_factors": ["Coastal proximity", "Informal settlements"],
        "recommendations": ["Community preparedness drills", "Early warning coordination"],
    },
    {
        "id": "barangay-306",
        "name": "Barangay 306",
        "district": "Quiapo",
        "risk_score": 0.88,
        "risk_category": "High",
        "population": 18750,
        "estimated_exposure": 14200,
        "hazard_indicators": {"flood_depth_m": 2.1, "rainfall_index": 0.82},
        "vulnerability_indicators": {"density_index": 0.79, "poverty_index": 0.71},
        "contributing_factors": ["Urban density", "Limited drainage capacity"],
        "recommendations": ["Improve localized drainage maintenance"],
    },
]

RISK_DISTRIBUTION = [
    {"category": "Low", "count": 299},
    {"category": "Medium", "count": 299},
    {"category": "High", "count": 299},
]

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

RECOMMENDATIONS = {
    "High": ["Prioritize evacuation planning", "Coordinate with barangay disaster teams"],
    "Medium": ["Monitor seasonal rainfall advisories", "Update community hazard maps"],
    "Low": ["Maintain drainage assets", "Review shelter capacity"],
}
