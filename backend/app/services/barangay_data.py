from __future__ import annotations

import hashlib
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
AREA_CSV = Path(__file__).resolve().parents[1] / "data" / "manila_barangay_area_mapping.csv"
DATASET_VERSION = "barangay_flood_risk_predictions"
NOTEBOOK_PATH = (
    Path(__file__).resolve().parents[3]
    / "src"
    / "ML-thesis-updated"
    / "Manila_Barangay_Flood_Risk_Pipeline.ipynb"
)


def _clean(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, float):
        return round(value, 6)
    return value


def _text(value) -> str | None:
    if value is None or pd.isna(value) or not str(value).strip():
        return None
    return str(value).strip()


def _record(row: pd.Series) -> dict:
    district = row.get("District")
    return {
        "id": row["Barangay"],
        "barangay_no": int(row["Barangay_No"]),
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
        "priority_score": _clean(float(row["DPI_Scaled"])),
        "risk_category": str(row["DPI_Risk_Class"]),
        "dpi_rank": int(row["DPI_Rank"]),
        "planning_reference": _text(row.get("Planning_Reference")),
        "drrm_pillar": _text(row.get("DRRM_Pillar")),
        "image_url": None,
        "area": _areas().get(row["Barangay"]),
    }


@lru_cache(maxsize=1)
def _areas() -> dict[str, str]:
    """Area names keyed by the published barangay name; never by Barangay_No (818 and 818-A differ)."""
    areas = pd.read_csv(AREA_CSV, dtype=str)
    duplicated = sorted(areas.loc[areas["Barangay"].duplicated(keep=False), "Barangay"].unique())
    if duplicated:
        raise ValueError(f"Area mapping has duplicate Barangay values: {duplicated}.")
    return {
        name: area
        for name, area in zip(areas["Barangay"], areas["Area"])
        if _text(area) is not None
    }


def validate_barangay_keys(frame: pd.DataFrame) -> None:
    """Fail loudly if `Barangay` cannot serve as the unique record key."""
    names = frame["Barangay"]
    blank = names.isna() | (names.astype(str).str.strip() == "")
    if blank.any():
        rows = [int(i) for i in frame.index[blank]]
        raise ValueError(f"Barangay values must be non-empty; blank or null at rows {rows}.")
    duplicated = sorted(names[names.duplicated(keep=False)].astype(str).unique())
    if duplicated:
        raise ValueError(f"Barangay values must be unique; duplicates found: {duplicated}.")


def attach_districts_by_barangay_no(predictions: pd.DataFrame, districts: pd.DataFrame) -> pd.DataFrame:
    """Join districts on Barangay_No, the only place Barangay_No is used as a key.

    The mapping CSV lists one row per barangay number and has no Barangay name column,
    so suffixed barangays ("Barangay 659-A") inherit the district of their parent number.
    """
    duplicated_numbers = sorted(
        int(n) for n in districts.loc[districts["Barangay_No"].duplicated(keep=False), "Barangay_No"].unique()
    )
    if duplicated_numbers:
        raise ValueError(f"District mapping has duplicate Barangay_No values: {duplicated_numbers}.")
    merged = predictions.merge(districts, on="Barangay_No", how="left")
    if len(merged) != len(predictions):
        raise ValueError(f"District join changed the row count from {len(predictions)} to {len(merged)}.")
    missing = sorted(merged.loc[merged["District"].isna(), "Barangay"].astype(str))
    if missing:
        raise ValueError(f"No district mapped for barangays: {missing}.")
    return merged


@lru_cache(maxsize=1)
def _frame() -> pd.DataFrame:
    predictions = pd.read_csv(PREDICTIONS_CSV)
    validate_barangay_keys(predictions)
    districts = pd.read_csv(DISTRICT_CSV)
    predictions["Barangay_No"] = pd.to_numeric(predictions["Barangay_No"], errors="coerce").astype("Int64")
    districts["Barangay_No"] = pd.to_numeric(districts["Barangay_No"], errors="coerce").astype("Int64")
    return attach_districts_by_barangay_no(predictions, districts)


def current_data_version() -> str:
    """Short checksum of the files behind the public barangay records; changes when any of them does."""
    digest = hashlib.sha256()
    for path in (PREDICTIONS_CSV, DISTRICT_CSV, AREA_CSV):
        digest.update(path.read_bytes())
    return digest.hexdigest()[:16]


def load_barangays() -> None:
    _frame()
    _areas()


def get_all_barangays() -> list[dict]:
    frame = _frame().sort_values("DPI_Rank")
    return [_record(row) for _, row in frame.iterrows()]


def get_barangay_by_id(barangay_id: str) -> dict | None:
    frame = _frame()
    match = frame.loc[frame["Barangay"] == barangay_id]
    if match.empty:
        return None
    return _record(match.iloc[0])


def get_rankings() -> list[dict]:
    return get_all_barangays()


def _ml_record(row: pd.Series) -> dict:
    """Staff-only: ML predictions are in-sample and must never reach public responses."""
    dpi_class = str(row["DPI_Risk_Class"])
    ml_class = str(row["ML_Predicted_Risk_Class"])
    return {
        "id": row["Barangay"],
        "name": row["Barangay"],
        "dpi_rank": int(row["DPI_Rank"]),
        "dpi_risk_class": dpi_class,
        "ml_predicted_risk_class": ml_class,
        "ml_prediction_confidence": _clean(float(row["ML_Prediction_Confidence"])),
        "model": str(row["Best_Model"]),
        "agrees_with_dpi": ml_class == dpi_class,
    }


def get_barangay_ml(barangay_id: str) -> dict | None:
    frame = _frame()
    match = frame.loc[frame["Barangay"] == barangay_id]
    if match.empty:
        return None
    return _ml_record(match.iloc[0])


def list_barangay_ml(differs_only: bool = False) -> list[dict]:
    records = [_ml_record(row) for _, row in _frame().sort_values("DPI_Rank").iterrows()]
    if differs_only:
        records = [record for record in records if not record["agrees_with_dpi"]]
    return records


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
