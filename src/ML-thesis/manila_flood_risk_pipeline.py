#!/usr/bin/env python3
"""
Manila Barangay Flood Risk Pipeline

Combines three workflows into one script:
  1. shp-to-csv   — flood shapefiles + admin boundaries -> validated flood CSV
  2. merged-dataset — PSA 2024 population + flood + admin base -> ML-ready dataset
  3. thesis-ml    — CSI, DPI, risk labels, and ML model training

Population data: PSA 2024 only (Population 2024).
The 100-year flood layer is retained for validation but excluded from CSI/DPI/ML.
"""

from __future__ import annotations

import argparse
import re
import sys
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import geopandas as gpd
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler

warnings.filterwarnings("ignore")
pd.set_option("display.max_columns", None)

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = SCRIPT_DIR
DEFAULT_SHP_DIR = SCRIPT_DIR / "metro-manila-shp-to-csv"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CITY_FILTER = "CITY OF MANILA"
AREA_EPSG = 32651
KEEP_ONLY_NUMBERED_BARANGAYS = True
EXPECTED_MIN_BARANGAY_NO = 1
EXPECTED_MAX_BARANGAY_NO = 905
EPS = 1e-6
APPLY_HAZARD_ATTRIBUTE_FILTER = False
HAZARD_FILTER_RULES: dict = {}

POPULATION_COL = "Population 2024"
DENSITY_COL = "Population Density 2024 per Hectare"
AFFECTED_5YR_COL = "Affected Population 2024 5yr"
AFFECTED_25YR_COL = "Affected Population 2024 25yr"
AFFECTED_INCREASE_COL = "Affected Population Increase 2024 5to25"
RELATIVE_DENSITY_COL = "Relative Pop Density 2024 vs District"
DISTRICT_DENSITY_COL = "District Avg Population Density 2024 per Hectare"

ELEVATION_CANDIDATES = [
    "Elevation",
    "Mean Elevation",
    "mean_elevation",
    "Avg Elevation",
    "avg_elevation",
]


@dataclass
class PipelinePaths:
    data_dir: Path
    shp_dir: Path
    output_dir: Path

    @property
    def admin_shp(self) -> Path:
        return self.shp_dir / "phl_admin4.shp"

    @property
    def flood_shps(self) -> dict[str, Path]:
        return {
            "5yr": self.shp_dir / "MetroManila_Flood_5year.shp",
            "25yr": self.shp_dir / "MetroManila_Flood_25year.shp",
            "100yr": self.shp_dir / "MetroManila_Flood_100year.shp",
        }

    @property
    def population_csv(self) -> Path:
        return self.data_dir / "population-dataset.csv"

    @property
    def base_csv(self) -> Path:
        return self.data_dir / "manila_final_base_dataset_NEW.csv"

    @property
    def elevation_csv(self) -> Path:
        return self.data_dir / "manila_barangay_elevation.csv"

    def resolve_flood_csv(self) -> Path:
        """Return existing flood CSV from output or shapefile directory."""
        candidates = [
            self.output_dir / "MetroManila_Barangay_Flood_Area_Validated.csv",
            self.shp_dir / "MetroManila_Barangay_Flood_Area_Validated.csv",
        ]
        for path in candidates:
            if path.exists():
                return path
        return candidates[0]

    @property
    def enriched_full_csv(self) -> Path:
        return self.output_dir / "manila-city-flood-population_enriched_FULL.csv"

    @property
    def ml_ready_csv(self) -> Path:
        return self.output_dir / "manila_ml_ready_dataset.csv"

    @property
    def dpi_labels_csv(self) -> Path:
        return self.output_dir / "manila_ml_ready_with_DPI_labels.csv"

    @property
    def final_predictions_csv(self) -> Path:
        return self.output_dir / "manila_final_DPI_ML_predictions.csv"

    @property
    def best_model_pkl(self) -> Path:
        return self.output_dir / "best_flood_risk_model.pkl"

    @property
    def label_encoder_pkl(self) -> Path:
        return self.output_dir / "label_encoder.pkl"


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def clean_barangay_name(x) -> str:
    x = str(x).upper().strip()
    x = re.sub(r"\s+", " ", x)
    x = x.replace("BRGY.", "BARANGAY").replace("BRGY", "BARANGAY")
    return x


def clean_barangay_name_strict(x) -> str:
    x = clean_barangay_name(x)
    return x.replace("-", "").replace(" ", "")


def extract_barangay_number(name) -> Optional[int]:
    if pd.isna(name):
        return None
    match = re.search(r"Barangay\s+(\d+)", str(name), flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def extract_number(text) -> int:
    match = re.search(r"(\d+)", str(text))
    return int(match.group()) if match else 0


def safe_numeric(df: pd.DataFrame, cols: Iterable[str]) -> pd.DataFrame:
    for col in cols:
        if col not in df.columns:
            continue
        if df[col].dtype == object:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(",", "", regex=False)
                .str.replace("%", "", regex=False)
            )
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def keep_existing(cols: Iterable[str], df: pd.DataFrame) -> list[str]:
    return [col for col in cols if col in df.columns]


def minmax_positive(series: pd.Series) -> pd.Series:
    series = pd.to_numeric(series, errors="coerce")
    min_val, max_val = series.min(), series.max()
    if pd.isna(min_val) or pd.isna(max_val) or max_val == min_val:
        return pd.Series(0.0, index=series.index)
    return (series - min_val) / (max_val - min_val)


def minmax_negative(series: pd.Series) -> pd.Series:
    series = pd.to_numeric(series, errors="coerce")
    min_val, max_val = series.min(), series.max()
    if pd.isna(min_val) or pd.isna(max_val) or max_val == min_val:
        return pd.Series(0.0, index=series.index)
    return (max_val - series) / (max_val - min_val)


def entropy_weights(dataframe: pd.DataFrame) -> tuple[pd.Series, pd.Series, pd.Series]:
    x = dataframe.copy().replace([np.inf, -np.inf], np.nan).fillna(0).clip(lower=0)
    for col in x.columns:
        min_val, max_val = x[col].min(), x[col].max()
        x[col] = (x[col] - min_val) / (max_val - min_val) if max_val != min_val else 0

    col_sums = x.sum(axis=0)
    p = x.div(col_sums.replace(0, np.nan), axis=1).fillna(0)
    m = len(x)
    k = 1 / np.log(m) if m > 1 else 1.0
    p_log = p.replace(0, np.nan)
    entropy = (-k * (p * np.log(p_log)).sum(axis=0)).fillna(0)
    diversification = 1 - entropy
    if diversification.sum() == 0:
        weights = pd.Series(1 / len(diversification), index=diversification.index)
    else:
        weights = diversification / diversification.sum()
    return weights, entropy, diversification


def find_first_existing_column(df: pd.DataFrame, candidates: list[str], label: str) -> str:
    col = next((c for c in candidates if c in df.columns), None)
    if not col:
        raise ValueError(f"Could not find {label} column in {list(df.columns)}")
    return col


def is_numbered_barangay(name) -> bool:
    if pd.isna(name):
        return False
    return bool(re.fullmatch(r"Barangay\s+\d+(-[A-Z])?", str(name).strip(), flags=re.IGNORECASE))


def detect_elevation_column(df: pd.DataFrame) -> Optional[str]:
    for col in ELEVATION_CANDIDATES:
        if col in df.columns and df[col].notna().any():
            return col
    return None


def ensure_output_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Stage 1: Shapefile -> CSV
# ---------------------------------------------------------------------------


def inspect_layer(path: Path, rp: str) -> tuple[gpd.GeoDataFrame, dict]:
    flood_raw = gpd.read_file(path)
    diagnostics = {
        "return_period": rp,
        "file": path.name,
        "crs": str(flood_raw.crs),
        "feature_count": len(flood_raw),
        "geometry_types": "; ".join(
            f"{k}:{v}" for k, v in flood_raw.geom_type.value_counts(dropna=False).to_dict().items()
        ),
        "columns": "; ".join(list(flood_raw.columns)),
    }
    return flood_raw, diagnostics


def apply_hazard_filter(flood: gpd.GeoDataFrame) -> tuple[gpd.GeoDataFrame, str]:
    if not APPLY_HAZARD_ATTRIBUTE_FILTER:
        return flood, "No attribute filter applied"
    if not HAZARD_FILTER_RULES:
        return flood, "Filter enabled but no HAZARD_FILTER_RULES configured"
    for col, rule_func in HAZARD_FILTER_RULES.items():
        if col in flood.columns:
            before = len(flood)
            flood = flood.loc[rule_func(flood[col])].copy()
            return flood, f"Applied filter on '{col}': {before} -> {len(flood)} features"
    return flood, "Filter enabled but no configured hazard column found"


def union_flood_geometries(flood: gpd.GeoDataFrame, crs) -> gpd.GeoDataFrame:
    if flood.empty:
        return gpd.GeoDataFrame(geometry=[], crs=crs)
    flood = flood.copy()
    flood["geometry"] = flood.geometry.buffer(0)
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()
    if flood.empty:
        return gpd.GeoDataFrame(geometry=[], crs=crs)
    try:
        union_geom = flood.geometry.union_all()
    except AttributeError:
        union_geom = flood.geometry.unary_union
    if union_geom is None or union_geom.is_empty:
        return gpd.GeoDataFrame(geometry=[], crs=crs)
    return gpd.GeoDataFrame(geometry=[union_geom], crs=crs)


def run_shp_to_csv(paths: PipelinePaths) -> pd.DataFrame:
    """Process admin + flood shapefiles into a validated barangay flood CSV."""
    print("\n=== Stage 1: Shapefile to CSV ===")

    if not paths.admin_shp.exists():
        raise FileNotFoundError(f"Admin shapefile not found: {paths.admin_shp}")

    admin = gpd.read_file(paths.admin_shp)
    brgy_col = find_first_existing_column(
        admin, ["adm4_name", "ADM4_EN", "adm4_en", "barangay"], "barangay"
    )

    if CITY_FILTER:
        city_col = find_first_existing_column(
            admin, ["adm3_name", "ADM3_EN", "adm3_en", "city"], "city"
        )
        admin = admin.loc[
            admin[city_col].astype(str).str.upper().str.strip() == CITY_FILTER.upper(),
            [brgy_col, "geometry"],
        ].copy()
        print(f"Filtered to {len(admin)} rows in {CITY_FILTER}")
    else:
        admin = admin[[brgy_col, "geometry"]].copy()

    admin = admin.rename(columns={brgy_col: "barangay"})
    admin["barangay"] = admin["barangay"].astype(str).str.strip()

    special_rows_csv = paths.output_dir / "MetroManila_Special_NonBarangay_Rows.csv"
    special_rows = admin.loc[~admin["barangay"].apply(is_numbered_barangay)].copy()
    if not special_rows.empty:
        ensure_output_dir(special_rows_csv)
        special_rows.drop(columns="geometry").to_csv(special_rows_csv, index=False)
        print(f"Special/non-barangay rows: {len(special_rows)}")

    if KEEP_ONLY_NUMBERED_BARANGAYS:
        before = len(admin)
        admin = admin.loc[admin["barangay"].apply(is_numbered_barangay)].copy()
        print(f"Kept numbered barangays: {before} -> {len(admin)}")

    admin = admin.to_crs(epsg=AREA_EPSG)
    admin["geometry"] = admin.geometry.buffer(0)
    admin["brgy_area_sqm"] = admin.geometry.area
    manila_boundary = admin.dissolve()[["geometry"]].copy()

    result = pd.DataFrame({
        "barangay": admin["barangay"].values,
        "brgy_area_sqm": admin["brgy_area_sqm"].values,
    })

    layer_diagnostics: list[dict] = []
    for rp, flood_path in paths.flood_shps.items():
        print(f"Processing {rp}: {flood_path}")
        if not flood_path.exists():
            raise FileNotFoundError(f"Flood shapefile not found: {flood_path}")

        flood, diag = inspect_layer(flood_path, rp)
        layer_diagnostics.append(diag)
        flood = flood.to_crs(admin.crs)
        flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()
        flood, _ = apply_hazard_filter(flood)
        flood["geometry"] = flood.geometry.buffer(0)
        flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()
        flood = gpd.clip(flood, manila_boundary)

        if flood.empty:
            result[f"flood_area_{rp}_sqm"] = 0.0
            result[f"flood_pct_{rp}"] = 0.0
            continue

        flood_union = union_flood_geometries(flood, admin.crs)
        if flood_union.empty:
            result[f"flood_area_{rp}_sqm"] = 0.0
            result[f"flood_pct_{rp}"] = 0.0
            continue

        joined = gpd.sjoin(
            flood_union,
            admin[["barangay", "geometry"]],
            how="inner",
            predicate="intersects",
        )
        if joined.empty:
            flood_by_brgy = pd.DataFrame(columns=["barangay", f"flood_area_{rp}_sqm"])
        else:
            flood_geoms = joined.geometry.reset_index(drop=True)
            admin_geoms = admin.loc[joined["index_right"], "geometry"].reset_index(drop=True)
            inter_area = flood_geoms.intersection(admin_geoms).area
            joined = joined.reset_index(drop=True)
            joined["barangay"] = admin.loc[joined["index_right"], "barangay"].reset_index(drop=True).values
            joined[f"flood_area_{rp}_sqm"] = inter_area.values
            flood_by_brgy = joined.groupby("barangay", as_index=False)[f"flood_area_{rp}_sqm"].sum()

        result = result.merge(flood_by_brgy, on="barangay", how="left")
        result[f"flood_area_{rp}_sqm"] = result[f"flood_area_{rp}_sqm"].fillna(0.0)
        result[f"flood_area_{rp}_sqm"] = result[f"flood_area_{rp}_sqm"].clip(
            lower=0, upper=result["brgy_area_sqm"]
        )
        result[f"flood_pct_{rp}"] = (
            result[f"flood_area_{rp}_sqm"] / result["brgy_area_sqm"] * 100
        ).clip(lower=0, upper=100)

    final = result.sort_values("barangay").reset_index(drop=True)
    final["flag_25yr_less_than_5yr"] = final["flood_pct_25yr"] + EPS < final["flood_pct_5yr"]
    final["flag_100yr_less_than_25yr"] = final["flood_pct_100yr"] + EPS < final["flood_pct_25yr"]
    final["flag_100yr_less_than_5yr"] = final["flood_pct_100yr"] + EPS < final["flood_pct_5yr"]
    final["barangay_no"] = final["barangay"].apply(extract_barangay_number)

    flood_out = paths.output_dir / "MetroManila_Barangay_Flood_Area_Validated.csv"
    ensure_output_dir(flood_out)
    final.to_csv(flood_out, index=False)
    pd.DataFrame(layer_diagnostics).to_csv(
        paths.output_dir / "MetroManila_Flood_Layer_Diagnostics.csv", index=False
    )

    print(f"Saved flood CSV: {flood_out} ({len(final)} barangays)")
    return final


# ---------------------------------------------------------------------------
# Stage 2: Merge datasets (PSA 2024 population only)
# ---------------------------------------------------------------------------


def load_psa_2024_population(path: Path) -> pd.DataFrame:
    """Load PSA 2024 barangay population (Barangay, Population 2024)."""
    df_pop = pd.read_csv(path, header=None, names=["Barangay", POPULATION_COL])
    df_pop["Barangay"] = df_pop["Barangay"].astype(str).str.strip()
    df_pop = df_pop[
        df_pop["Barangay"].notna()
        & (df_pop["Barangay"].str.strip() != "")
        & (df_pop["Barangay"].str.lower() != "nan")
    ].copy()
    df_pop[POPULATION_COL] = pd.to_numeric(df_pop[POPULATION_COL], errors="coerce")
    df_pop = df_pop[df_pop[POPULATION_COL].notna()].copy()
    print(f"Loaded PSA 2024 population: {len(df_pop)} barangays")
    return df_pop


def load_flood_dataset(path: Path) -> pd.DataFrame:
    """Load flood CSV produced by stage 1 (or existing validated export)."""
    df = pd.read_csv(path)
    rename_map = {
        "barangay": "Barangay",
        "brgy_area_sqm": "Barangay Area Sqm",
        "flood_area_5yr_sqm": "Flood Area 5yr Sqm",
        "flood_pct_5yr": "Flood PCT 5yr",
        "flood_area_25yr_sqm": "Flood Area 25yr Sqm",
        "flood_pct_25yr": "Flood PCT 25yr",
        "flood_area_100yr_sqm": "Flood Area 100yr Sqm",
        "flood_pct_100yr": "Flood PCT 100yr",
        "barangay_no": "Barangay No",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    df["Barangay"] = df["Barangay"].astype(str).str.strip()
    print(f"Loaded flood dataset: {len(df)} barangays")
    return df


def engineer_psa2024_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build exposure/vulnerability features using PSA 2024 population only."""
    area_sqm = df["Barangay Area Sqm"]
    pop = df[POPULATION_COL]

    df[DENSITY_COL] = np.where(area_sqm > 0, pop / (area_sqm / 10_000), np.nan)
    df["Flood Ratio 5yr"] = df["Flood PCT 5yr"] / 100
    df["Flood Ratio 25yr"] = df["Flood PCT 25yr"] / 100

    df[AFFECTED_5YR_COL] = (pop * df["Flood Ratio 5yr"]).round(0).astype("Int64")
    df[AFFECTED_25YR_COL] = (pop * df["Flood Ratio 25yr"]).round(0).astype("Int64")
    df[AFFECTED_INCREASE_COL] = df[AFFECTED_25YR_COL] - df[AFFECTED_5YR_COL]

    df["Flood Escalation 5to25"] = df["Flood PCT 25yr"] - df["Flood PCT 5yr"]
    df["Flood Severity Increase 5to25 Sqm"] = (
        df["Flood Area 25yr Sqm"] - df["Flood Area 5yr Sqm"]
    )

    if "bgyarea_sqkm" in df.columns:
        df["Base Area Sqm"] = df["bgyarea_sqkm"] * 1_000_000
        df["Area Difference Sqm"] = df["Barangay Area Sqm"] - df["Base Area Sqm"]
        df["Area Difference Pct"] = np.where(
            df["Base Area Sqm"] > 0,
            (df["Area Difference Sqm"] / df["Base Area Sqm"]) * 100,
            np.nan,
        )

    if "city_name" in df.columns:
        df["District Avg Flood PCT 5yr"] = df.groupby("city_name")["Flood PCT 5yr"].transform("mean")
        df["District Avg Flood PCT 25yr"] = df.groupby("city_name")["Flood PCT 25yr"].transform("mean")
        df[DISTRICT_DENSITY_COL] = df.groupby("city_name")[DENSITY_COL].transform("mean")
        df["Relative Flood Risk 25yr vs District"] = (
            df["Flood PCT 25yr"] - df["District Avg Flood PCT 25yr"]
        )
        df[RELATIVE_DENSITY_COL] = df[DENSITY_COL] - df[DISTRICT_DENSITY_COL]

    df["100yr Data Quality Note"] = np.where(
        (df.get("Flag 100yr Less than 25yr", False)) | (df.get("Flag 100yr Less than 5yr", False)),
        "Review 100yr value: lower than expected return-period progression",
        "OK",
    )
    return df


def build_ml_ready_dataset(df: pd.DataFrame) -> pd.DataFrame:
    id_cols = keep_existing(
        ["Barangay", "Barangay No", "psgc_10d", "city_name", "brgy_code", POPULATION_COL],
        df,
    )
    feature_cols = keep_existing(
        [
            "Flood PCT 5yr",
            "Flood PCT 25yr",
            "Flood Escalation 5to25",
            "Flood Severity Increase 5to25 Sqm",
            AFFECTED_5YR_COL,
            AFFECTED_25YR_COL,
            AFFECTED_INCREASE_COL,
            DENSITY_COL,
            "District Avg Flood PCT 5yr",
            "District Avg Flood PCT 25yr",
            DISTRICT_DENSITY_COL,
            "Relative Flood Risk 25yr vs District",
            RELATIVE_DENSITY_COL,
            "Area Difference Pct",
            *ELEVATION_CANDIDATES,
        ],
        df,
    )
    feature_cols = list(dict.fromkeys(feature_cols))
    return df[id_cols + feature_cols].copy()


def run_merge_dataset(paths: PipelinePaths, flood_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """Merge PSA 2024 population, flood areas, and admin base metadata."""
    print("\n=== Stage 2: Merge Dataset (PSA 2024) ===")

    if not paths.population_csv.exists():
        raise FileNotFoundError(f"PSA 2024 population file not found: {paths.population_csv}")
    if flood_df is None:
        flood_path = paths.resolve_flood_csv()
        if not flood_path.exists():
            raise FileNotFoundError(
                f"Flood CSV not found. Run stage 'shp' first or provide --flood-csv."
            )
        flood_df = load_flood_dataset(flood_path)

    df_pop = load_psa_2024_population(paths.population_csv)
    df = pd.merge(df_pop, flood_df, on="Barangay", how="inner")
    print(f"Population + flood merge: {len(df)} rows")

    core_numeric = keep_existing(
        [
            POPULATION_COL,
            "Barangay Area Sqm",
            "Flood Area 5yr Sqm",
            "Flood PCT 5yr",
            "Flood Area 25yr Sqm",
            "Flood PCT 25yr",
            "Flood Area 100yr Sqm",
            "Flood PCT 100yr",
        ],
        df,
    )
    df = safe_numeric(df, core_numeric)

    df["Sort_Key"] = df["Barangay"].apply(extract_number)
    df = df.sort_values(["Sort_Key", "Barangay"]).drop(columns=["Sort_Key"]).reset_index(drop=True)

    if paths.base_csv.exists():
        df_base = pd.read_csv(paths.base_csv)
        df_base.columns = (
            df_base.columns.str.lower().str.strip().str.replace(" ", "_", regex=False)
        )
        base_barangay_col = next(
            (c for c in ["brgy_name", "barangay", "barangay_name", "brgy"] if c in df_base.columns),
            None,
        )
        if base_barangay_col:
            df["barangay_clean"] = df["Barangay"].apply(clean_barangay_name)
            df["barangay_key_strict"] = df["Barangay"].apply(clean_barangay_name_strict)
            df_base["barangay_clean"] = df_base[base_barangay_col].apply(clean_barangay_name)
            df_base["barangay_key_strict"] = df_base[base_barangay_col].apply(clean_barangay_name_strict)

            base_keep = keep_existing(
                [
                    "barangay_key_strict",
                    "psgc_10d",
                    "reg_name",
                    "city_name",
                    "brgy_code",
                    "bgyarea_sqkm",
                    "geographic_level",
                    "class",
                    "urban_rural2015",
                ],
                df_base,
            )
            df_base_sel = df_base[base_keep].drop_duplicates(subset=["barangay_key_strict"])
            df = pd.merge(df, df_base_sel, on="barangay_key_strict", how="left")
            print(f"Base metadata merge: {df['city_name'].notna().sum()} matched")
        else:
            print("Warning: no barangay column in base dataset; skipping admin merge.")
    else:
        print(f"Warning: base dataset not found at {paths.base_csv}; continuing without admin metadata.")

    if paths.elevation_csv.exists():
        df_elev = pd.read_csv(paths.elevation_csv)
        elev_barangay_col = next(
            (c for c in ["Barangay", "barangay", "brgy_name"] if c in df_elev.columns), None
        )
        elev_value_col = detect_elevation_column(df_elev)
        if elev_barangay_col and elev_value_col:
            df_elev = df_elev.rename(columns={elev_value_col: "Elevation"})
            df = pd.merge(df, df_elev[[elev_barangay_col, "Elevation"]], left_on="Barangay", right_on=elev_barangay_col, how="left")
            if elev_barangay_col != "Barangay":
                df = df.drop(columns=[elev_barangay_col])
            print(f"Elevation merged: {df['Elevation'].notna().sum()} barangays with elevation")

    df = engineer_psa2024_features(df)
    df_ml = build_ml_ready_dataset(df)

    ensure_output_dir(paths.enriched_full_csv)
    df.to_csv(paths.enriched_full_csv, index=False)
    df_ml.to_csv(paths.ml_ready_csv, index=False)
    print(f"Saved enriched dataset: {paths.enriched_full_csv}")
    print(f"Saved ML-ready dataset: {paths.ml_ready_csv} ({df_ml.shape})")
    return df_ml


# ---------------------------------------------------------------------------
# Stage 3: Thesis ML (CSI, DPI, models)
# ---------------------------------------------------------------------------


def compute_dpi_and_labels(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Compute CSI, exposure/vulnerability scores, entropy-weighted DPI, and risk classes."""
    elevation_col = detect_elevation_column(df)

    required = [
        "Barangay",
        "Flood PCT 5yr",
        "Flood PCT 25yr",
        "Flood Escalation 5to25",
        "Flood Severity Increase 5to25 Sqm",
        AFFECTED_5YR_COL,
        AFFECTED_25YR_COL,
        AFFECTED_INCREASE_COL,
        DENSITY_COL,
        RELATIVE_DENSITY_COL,
    ]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns for DPI: {missing}")

    numeric_cols = required + keep_existing(
        [
            "District Avg Flood PCT 5yr",
            "District Avg Flood PCT 25yr",
            DISTRICT_DENSITY_COL,
            "Relative Flood Risk 25yr vs District",
            "Area Difference Pct",
            "Elevation",
        ],
        df,
    )
    df = safe_numeric(df, numeric_cols)

    df["norm_flood_pct_5yr"] = minmax_positive(df["Flood PCT 5yr"])
    df["norm_flood_pct_25yr"] = minmax_positive(df["Flood PCT 25yr"])
    df["norm_flood_escalation_5to25"] = minmax_positive(df["Flood Escalation 5to25"])
    df["norm_flood_severity_increase_5to25_sqm"] = minmax_positive(
        df["Flood Severity Increase 5to25 Sqm"]
    )
    df["CSI Score"] = df[
        [
            "norm_flood_pct_5yr",
            "norm_flood_pct_25yr",
            "norm_flood_escalation_5to25",
            "norm_flood_severity_increase_5to25_sqm",
        ]
    ].mean(axis=1)
    df["Hazard Score"] = df["CSI Score"]

    df["norm_affected_pop_5yr"] = minmax_positive(df[AFFECTED_5YR_COL])
    df["norm_affected_pop_25yr"] = minmax_positive(df[AFFECTED_25YR_COL])
    df["norm_affected_pop_increase_5to25"] = minmax_positive(df[AFFECTED_INCREASE_COL])
    df["Exposure Score"] = df[
        ["norm_affected_pop_5yr", "norm_affected_pop_25yr", "norm_affected_pop_increase_5to25"]
    ].mean(axis=1)

    df["norm_population_density"] = minmax_positive(df[DENSITY_COL])
    df["norm_relative_population_density"] = minmax_positive(df[RELATIVE_DENSITY_COL])
    vulnerability_norm_cols = ["norm_population_density", "norm_relative_population_density"]

    if elevation_col:
        df["norm_elevation_susceptibility"] = minmax_negative(df[elevation_col])
        vulnerability_norm_cols.append("norm_elevation_susceptibility")
        print(f"Elevation included in Vulnerability Score: {elevation_col}")
    else:
        print("No elevation column found; Vulnerability Score uses PSA 2024 density indicators only.")

    df["Vulnerability Score"] = df[vulnerability_norm_cols].mean(axis=1)

    component_cols = ["Hazard Score", "Exposure Score", "Vulnerability Score"]
    entropy_w, entropy_values, diversification_values = entropy_weights(df[component_cols])
    weights_table = pd.DataFrame({
        "Component": entropy_w.index,
        "Entropy Value": entropy_values.values,
        "Diversification Value": diversification_values.values,
        "Entropy Weight": entropy_w.values,
    })

    df["DPI Score"] = sum(entropy_w[c] * df[c] for c in component_cols)
    df["DPI Score 0to100"] = minmax_positive(df["DPI Score"]) * 100
    df["DPI Risk Class"] = pd.qcut(
        df["DPI Score 0to100"],
        q=3,
        labels=["Low", "Medium", "High"],
        duplicates="drop",
    )

    print("Entropy weights:")
    print(weights_table.to_string(index=False))
    print("\nRisk class distribution:")
    print(df["DPI Risk Class"].value_counts().to_string())
    return df, weights_table


def run_thesis_ml(paths: PipelinePaths, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """Train ML models on PSA 2024 features and export predictions."""
    print("\n=== Stage 3: Thesis ML (CSI / DPI / Models) ===")

    if df is None:
        if not paths.ml_ready_csv.exists():
            raise FileNotFoundError(
                f"ML-ready dataset not found: {paths.ml_ready_csv}. Run stage 'merge' first."
            )
        df = pd.read_csv(paths.ml_ready_csv)
    df.columns = df.columns.astype(str).str.strip()

    df, weights_table = compute_dpi_and_labels(df)

    ensure_output_dir(paths.dpi_labels_csv)
    df.to_csv(paths.dpi_labels_csv, index=False)
    weights_table.to_csv(paths.output_dir / "entropy_component_weights.csv", index=False)

    target_col = "DPI Risk Class"
    candidate_features = keep_existing(
        [
            "Flood PCT 5yr",
            "Flood PCT 25yr",
            "Flood Escalation 5to25",
            "Flood Severity Increase 5to25 Sqm",
            POPULATION_COL,
            AFFECTED_5YR_COL,
            AFFECTED_25YR_COL,
            AFFECTED_INCREASE_COL,
            DENSITY_COL,
            RELATIVE_DENSITY_COL,
            "District Avg Flood PCT 5yr",
            "District Avg Flood PCT 25yr",
            DISTRICT_DENSITY_COL,
            "Relative Flood Risk 25yr vs District",
            "Area Difference Pct",
            "Elevation",
        ],
        df,
    )
    candidate_features = list(dict.fromkeys(candidate_features))

    leakage_cols = {
        "CSI Score", "Hazard Score", "Exposure Score", "Vulnerability Score",
        "DPI Score", "DPI Score 0to100", target_col,
        "norm_flood_pct_5yr", "norm_flood_pct_25yr", "norm_flood_escalation_5to25",
        "norm_flood_severity_increase_5to25_sqm", "norm_affected_pop_5yr",
        "norm_affected_pop_25yr", "norm_affected_pop_increase_5to25",
        "norm_population_density", "norm_relative_population_density",
        "norm_elevation_susceptibility",
    }
    leakage = [c for c in candidate_features if c in leakage_cols]
    if leakage:
        raise ValueError(f"Data leakage detected in features: {leakage}")

    ml_features = candidate_features
    df_model = df[ml_features + [target_col]].dropna(subset=[target_col]).copy()
    print(f"ML dataset: {df_model.shape[0]} rows, {len(ml_features)} features")

    x = df_model[ml_features]
    y = df_model[target_col].astype(str)
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )

    models = {
        "Random Forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", RandomForestClassifier(
                n_estimators=300, random_state=42, class_weight="balanced"
            )),
        ]),
        "Gradient Boosting": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", GradientBoostingClassifier(random_state=42)),
        ]),
        "MLP": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", MLPClassifier(
                hidden_layer_sizes=(64, 32), max_iter=1000, random_state=42, early_stopping=True
            )),
        ]),
    }

    results = []
    trained_models = {}
    for name, pipeline in models.items():
        print(f"\nTraining {name}...")
        pipeline.fit(x_train, y_train)
        trained_models[name] = pipeline
        y_pred = pipeline.predict(x_test)
        y_proba = pipeline.predict_proba(x_test) if hasattr(pipeline, "predict_proba") else None
        try:
            roc_auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="macro") if y_proba is not None else np.nan
        except Exception:
            roc_auc = np.nan
        results.append({
            "Model": name,
            "Accuracy": accuracy_score(y_test, y_pred),
            "Balanced Accuracy": balanced_accuracy_score(y_test, y_pred),
            "F1 Macro": f1_score(y_test, y_pred, average="macro"),
            "F1 Weighted": f1_score(y_test, y_pred, average="weighted"),
            "ROC-AUC OVR Macro": roc_auc,
        })
        print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    results_df = pd.DataFrame(results).sort_values("F1 Macro", ascending=False)
    print("\nModel comparison (test set):")
    print(results_df.to_string(index=False))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "accuracy": "accuracy",
        "balanced_accuracy": "balanced_accuracy",
        "f1_macro": "f1_macro",
        "f1_weighted": "f1_weighted",
        "roc_auc_ovr": "roc_auc_ovr",
    }
    cv_results = []
    for name, pipeline in models.items():
        scores = cross_validate(
            pipeline, x, y_encoded, cv=cv, scoring=scoring, n_jobs=-1, error_score=np.nan
        )
        cv_results.append({
            "Model": name,
            "CV F1 Macro Mean": np.nanmean(scores["test_f1_macro"]),
            "CV F1 Macro Std": np.nanstd(scores["test_f1_macro"]),
            "CV Balanced Accuracy Mean": np.nanmean(scores["test_balanced_accuracy"]),
        })

    cv_results_df = pd.DataFrame(cv_results).sort_values("CV F1 Macro Mean", ascending=False)
    final_comparison = results_df.merge(cv_results_df, on="Model", how="left").sort_values(
        ["CV F1 Macro Mean", "F1 Macro"], ascending=False
    )
    best_model_name = final_comparison.iloc[0]["Model"]
    best_model = trained_models[best_model_name]
    print(f"\nBest model: {best_model_name}")

    x_all = df[ml_features].copy()
    df["ML Predicted Class Encoded"] = best_model.predict(x_all)
    df["ML Predicted Risk Class"] = label_encoder.inverse_transform(df["ML Predicted Class Encoded"])
    if hasattr(best_model, "predict_proba"):
        df["ML Prediction Confidence"] = best_model.predict_proba(x_all).max(axis=1)
    else:
        df["ML Prediction Confidence"] = np.nan
    df["Best Model"] = best_model_name

    ensure_output_dir(paths.final_predictions_csv)
    df.to_csv(paths.final_predictions_csv, index=False)
    final_comparison.to_csv(paths.output_dir / "model_comparison_results.csv", index=False)
    cv_results_df.to_csv(paths.output_dir / "cross_validation_results.csv", index=False)
    joblib.dump(best_model, paths.best_model_pkl)
    joblib.dump(label_encoder, paths.label_encoder_pkl)

    print(f"Saved final predictions: {paths.final_predictions_csv}")
    print(f"Saved best model: {paths.best_model_pkl}")
    return df


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Manila flood risk pipeline: shp-to-csv -> merge (PSA 2024) -> thesis ML"
    )
    parser.add_argument(
        "--stage",
        choices=["all", "shp", "merge", "ml"],
        default="all",
        help="Pipeline stage to run (default: all)",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directory containing population-dataset.csv and base dataset",
    )
    parser.add_argument(
        "--shp-dir",
        type=Path,
        default=DEFAULT_SHP_DIR,
        help="Directory containing shapefiles for stage 1",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for pipeline outputs",
    )
    parser.add_argument(
        "--flood-csv",
        type=Path,
        default=None,
        help="Optional existing flood CSV (skips shp stage when using --stage merge)",
    )
    parser.add_argument(
        "--skip-shp-if-missing",
        action="store_true",
        help="Skip shp stage when shapefiles are missing but flood CSV exists",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    paths = PipelinePaths(
        data_dir=args.data_dir.resolve(),
        shp_dir=args.shp_dir.resolve(),
        output_dir=args.output_dir.resolve(),
    )
    paths.output_dir.mkdir(parents=True, exist_ok=True)

    print("Manila Flood Risk Pipeline")
    print(f"  Data dir:   {paths.data_dir}")
    print(f"  Shape dir:  {paths.shp_dir}")
    print(f"  Output dir: {paths.output_dir}")
    print(f"  Population: PSA 2024 only ({POPULATION_COL})")

    flood_df: Optional[pd.DataFrame] = None
    ml_df: Optional[pd.DataFrame] = None

    run_shp = args.stage in ("all", "shp")
    run_merge = args.stage in ("all", "merge")
    run_ml = args.stage in ("all", "ml")

    if run_shp:
        shp_missing = not paths.admin_shp.exists() or any(
            not p.exists() for p in paths.flood_shps.values()
        )
        if shp_missing:
            if args.skip_shp_if_missing and paths.resolve_flood_csv().exists():
                print("Shapefiles missing; using existing flood CSV.")
            elif args.flood_csv and args.flood_csv.exists():
                print(f"Shapefiles missing; using --flood-csv {args.flood_csv}")
            else:
                print(
                    "ERROR: Shapefiles not found. Place .shp files in --shp-dir or run with "
                    "--stage merge --skip-shp-if-missing when flood CSV already exists.",
                    file=sys.stderr,
                )
                return 1
        else:
            flood_df = run_shp_to_csv(paths)

    if run_merge:
        if args.flood_csv:
            flood_df = load_flood_dataset(args.flood_csv)
        elif flood_df is None:
            flood_path = paths.resolve_flood_csv()
            if flood_path.exists():
                flood_df = load_flood_dataset(flood_path)
        ml_df = run_merge_dataset(paths, flood_df=flood_df)

    if run_ml:
        run_thesis_ml(paths, df=ml_df)

    print("\nPipeline complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
