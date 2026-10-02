from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

import pandas as pd

PREDICTIONS_CSV = (
    Path(__file__).resolve().parents[3]
    / "src"
    / "ML-thesis-updated"
    / "Output"
    / "barangay_flood_risk_predictions.csv"
)
DISTRICT_CSV = Path(__file__).resolve().parents[1] / "data" / "manila_barangay_district_mapping.csv"
DATASET_VERSION = "barangay_flood_risk_predictions"
NOTEBOOK_PATH = (
    Path(__file__).resolve().parents[3]
    / "src"
    / "ML-thesis-updated"
    / "flood_risk_pipeline_manila.ipynb"
)


def _clean(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, float):
        return round(value, 6)
    return value


def _record(row: pd.Series) -> dict:
    barangay_no = int(row["Barangay_No"])
    district = row.get("District")
    return {
        "id": str(barangay_no),
        "barangay_no": barangay_no,
        "name": row["Barangay"],
        "district": None if pd.isna(district) else str(district),
        "population_2020": _clean(float(row["Population_2020"])),
        "population_2024": _clean(float(row["Population_2024"])),
        "population_density_per_hectare": _clean(float(row["Population_Density_per_Hectare"])),
        "population_change_2020_2024_pct": _clean(float(row["Population_Change_2020_2024_Pct"])),
        "elevation_mean": _clean(float(row["Elevation_Mean"])),
        "flood_pct_5yr": _clean(float(row["Flood_PCT_5yr"])),
        "flood_pct_25yr": _clean(float(row["Flood_PCT_25yr"])),
        "hazard": _clean(float(row["Hazard"])),
        "exposure": _clean(float(row["Exposure"])),
        "vulnerability": _clean(float(row["Vulnerability"])),
        "dpi": _clean(float(row["DPI"])),
        "dpi_scaled": _clean(float(row["DPI_Scaled"])),
        "risk_category": str(row["DPI_Risk_Class"]),
        "dpi_rank": int(row["DPI_Rank"]),
        "ml_predicted_risk_class": str(row["ML_Predicted_Risk_Class"]),
        "ml_prediction_confidence": _clean(float(row["ML_Prediction_Confidence"])),
        "best_model": str(row["Best_Model"]),
        "image_url": None,
    }


@lru_cache(maxsize=1)
def _frame() -> pd.DataFrame:
    predictions = pd.read_csv(PREDICTIONS_CSV)
    districts = pd.read_csv(DISTRICT_CSV)
    predictions["Barangay_No"] = pd.to_numeric(predictions["Barangay_No"], errors="coerce").astype("Int64")
    districts["Barangay_No"] = pd.to_numeric(districts["Barangay_No"], errors="coerce").astype("Int64")
    merged = predictions.merge(districts, on="Barangay_No", how="left")
    return merged


def get_all_barangays() -> list[dict]:
    frame = _frame().sort_values("DPI_Rank")
    return [_record(row) for _, row in frame.iterrows()]


def get_barangay_by_id(barangay_id: str) -> dict | None:
    frame = _frame()
    key = str(barangay_id).strip()
    numeric = pd.to_numeric(key, errors="coerce")
    if pd.notna(numeric):
        match = frame.loc[frame["Barangay_No"] == int(numeric)]
    else:
        match = frame.loc[frame["Barangay"].astype(str).str.lower() == key.lower()]
    if match.empty:
        return None
    return _record(match.iloc[0])


def get_rankings() -> list[dict]:
    return get_all_barangays()


@lru_cache(maxsize=1)
def get_model_evaluation() -> dict:
    """Read the saved pipeline notebook output for the selected model."""
    text = NOTEBOOK_PATH.read_text(encoding="utf-8")
    model_names = re.findall(r"Best model: ([A-Za-z][A-Za-z ]+)", text)
    if not model_names:
        raise RuntimeError("Selected model name was not found in the pipeline notebook.")
    model_name = model_names[-1].strip()
    score_row = re.search(
        rf"{re.escape(model_name)}\s+(0\.\d+)\s+0\.\d+",
        text,
    )
    if score_row is None:
        raise RuntimeError("CV F1-macro for the selected model was not found.")
    return {
        "model_name": model_name,
        "f1_macro_cv": round(float(score_row.group(1)), 4),
        "metric": "training cross-validation F1-macro",
    }


def get_overview_stats() -> dict:
    rows = get_all_barangays()
    counts = {"Low": 0, "Medium": 0, "High": 0}
    exposed = 0.0
    for row in rows:
        label = row["risk_category"]
        if label in counts:
            counts[label] += 1
        exposed += row["population_2024"] or 0
    return {
        "system_name": "AGOS Manila",
        "dataset_version": DATASET_VERSION,
        "total_barangays": len(rows),
        "high_priority_count": counts["High"],
        "medium_priority_count": counts["Medium"],
        "low_priority_count": counts["Low"],
        "estimated_exposed_population": round(exposed),
        "risk_distribution": [
            {"category": "High", "count": counts["High"]},
            {"category": "Medium", "count": counts["Medium"]},
            {"category": "Low", "count": counts["Low"]},
        ],
        "priority_barangays": rows[:5],
    }
