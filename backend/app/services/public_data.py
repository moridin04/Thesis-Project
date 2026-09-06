from __future__ import annotations

"""Published public data served by read-only endpoints."""

OVERVIEW = {
    "system_name": "SAGIP Manila",
    "acronym": "Spatial Analytics for GIS-Based Inundation Prioritization",
    "formal_title": (
        "SAGIP: A Barangay-Level Flood Risk Mapping and Disaster Prioritization "
        "System for the City of Manila"
    ),
    "dataset_version": "2026.1-mock",
    "last_updated": "2026-08-22",
    "disclaimer": (
        "SAGIP is a planning and decision-support prototype. It does not provide "
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
        "risk_category": "Critical",
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
        "risk_category": "Critical",
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
    {"category": "Low", "count": 318},
    {"category": "Moderate", "count": 287},
    {"category": "High", "count": 150},
    {"category": "Critical", "count": 142},
]

INDICATORS = [
    {
        "name": "Flood depth",
        "category": "Hazard",
        "description": "Estimated maximum inundation depth during modeled rainfall scenarios.",
    },
    {
        "name": "Population density",
        "category": "Exposure",
        "description": "Residents per square kilometer within the barangay boundary.",
    },
    {
        "name": "Poverty index",
        "category": "Vulnerability",
        "description": "Composite socioeconomic vulnerability indicator.",
    },
]

METHODOLOGY = {
    "data_sources": ["OpenStreetMap", "PSA census tables", "Modeled rainfall scenarios"],
    "preprocessing": "Spatial joins, normalization, and missing-value handling.",
    "classification": "Random Forest risk classification with cross-validation.",
    "limitations": "Prototype outputs use approved mock and sample datasets.",
}

RECOMMENDATIONS = {
    "Critical": ["Prioritize evacuation planning", "Coordinate with barangay disaster teams"],
    "High": ["Maintain drainage assets", "Review shelter capacity"],
    "Moderate": ["Monitor seasonal rainfall advisories", "Update community hazard maps"],
}
