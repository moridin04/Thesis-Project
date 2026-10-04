#!/usr/bin/env python3
"""
Spot-check zero-flood barangays against source shapefiles.

Read-only diagnostic: does NOT modify metro-manila-shp-to-csv.py outputs,
pipeline notebooks, or existing validated CSVs other than writing its own
results file: zero_barangay_spot_check_results.csv
"""

# Check listed zero-flood barangays against the source shapefiles.
# Group 1 is checked on the 5-year and 25-year layers. Group 2 is 5-year only.
# An overlap larger than 1e-6 square meters is called a discrepancy.
# This file writes its own results CSV and leaves the validated flood CSV as-is.
from __future__ import annotations

import os
import re
import sys

import geopandas as gpd
import pandas as pd
from shapely import make_valid, prepared
from shapely.geometry import box

# ============================================================
# PATHS — mirror metro-manila-shp-to-csv.py (+ Manila AOI fallback)
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Prefer complete Manila AOI (phl_admin4.dbf in Downloads was truncated).
ADMIN_CANDIDATES = [
    os.path.join(SCRIPT_DIR, "City-of-Manila-Barangays-AOI.shp"),
    os.path.expanduser(
        "~/Downloads/THESIS1/NAMRIA/city-of-manila-barangays-aoi/"
        "City-of-Manila-Barangays-AOI.shp"
    ),
    "/tmp/manila_brgy_aoi/city-of-manila-barangays-aoi/City-of-Manila-Barangays-AOI.shp",
    os.path.join(SCRIPT_DIR, "phl_admin4.shp"),
]
ADMIN_FILE = None  # resolved at runtime
FLOOD_5YR = os.path.join(SCRIPT_DIR, "MetroManila_Flood_5year.shp")
FLOOD_25YR = os.path.join(SCRIPT_DIR, "MetroManila_Flood_25year.shp")
VALIDATED_CSV = os.path.join(SCRIPT_DIR, "MetroManila_Barangay_Flood_Area_Validated.csv")
OUT_CSV = os.path.join(SCRIPT_DIR, "zero_barangay_spot_check_results.csv")

CITY_FILTER = "CITY OF MANILA"
AREA_EPSG = 32651

# Join key confirmed from Validated CSV: barangay_no (int)
GROUP1_BOTH_ZERO = [188, 546, 547, 549, 573]  # check 5yr + 25yr
GROUP2_5YR_ONLY = [120, 36, 38, 552, 554, 778]  # check 5yr only


# First matching column, or an error if none of the names exist.
def find_first_existing_column(df, candidates, label):
    col = next((c for c in candidates if c in df.columns), None)
    if not col:
        raise ValueError(f"Could not find {label} column in {list(df.columns)}")
    return col


# Integer from a Barangay N name, or None when there is no number.
def extract_barangay_number(name):
    if pd.isna(name):
        return None
    match = re.search(r"Barangay\s+(\d+)", str(name), flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


# Stop if a required shapefile or CSV is not on disk.
def require_file(path: str) -> None:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Required input not found: {path}\n"
            f"Place the same shapefiles used by metro-manila-shp-to-csv.py "
            f"in {SCRIPT_DIR} and re-run."
        )


# True when the barangay touches the flood layer bounding box.
def geom_within_extent(geom, extent_bounds) -> bool:
    """True if barangay intersects the flood layer total bounding box."""
    minx, miny, maxx, maxy = extent_bounds
    extent_poly = box(minx, miny, maxx, maxy)
    return bool(geom.intersects(extent_poly))


# Intersect the barangay with flood features near its bounding box.
# Returns whether any hit, the total overlap area, and a detail list.
def check_intersections(brgy_geom, flood_gdf: gpd.GeoDataFrame):
    """
    Test barangay geometry against every flood feature.
    Returns (intersects_any, total_intersection_area_sqm, detail_list).
    """
    details = []
    total_area = 0.0
    # Bounding-box prefilter via GeoPandas spatial index
    possible = list(flood_gdf.sindex.intersection(brgy_geom.bounds))
    for idx in possible:
        flood_geom = flood_gdf.geometry.iloc[idx]
        if flood_geom is None or flood_geom.is_empty:
            continue
        prep = prepared.prep(flood_geom)
        if not prep.intersects(brgy_geom):
            continue
        inter = brgy_geom.intersection(flood_geom)
        area = float(inter.area) if inter is not None and not inter.is_empty else 0.0
        total_area += area
        details.append(
            {
                "flood_feature_index": int(flood_gdf.index[idx]),
                "intersection_area_sqm": area,
            }
        )
    return (len(details) > 0), total_area, details


# Label the row as a discrepancy, a geometry issue, outside, or a true zero.
def conclude(valid_before, valid_after, within_extent, intersects, inter_area) -> str:
    if intersects and inter_area > 1e-6:
        return "DISCREPANCY FOUND - NON-ZERO INTERSECTION DETECTED"
    if not valid_after:
        return "NEEDS REVIEW - GEOMETRY ISSUE"
    if not valid_before:
        return "NEEDS REVIEW - GEOMETRY ISSUE"
    if not within_extent:
        return "NEEDS REVIEW - OUTSIDE EXTENT"
    return "CONFIRMED TRUE ZERO"


# First admin shapefile in the list that opens and has rows.
def resolve_admin_file() -> str:
    """Pick a readable admin shapefile (complete .dbf required)."""
    errors = []
    for path in ADMIN_CANDIDATES:
        if not os.path.exists(path):
            errors.append(f"missing: {path}")
            continue
        try:
            probe = gpd.read_file(path)
            if probe.empty:
                errors.append(f"empty: {path}")
                continue
            print(f"Using admin boundaries: {path} (rows={len(probe)})", flush=True)
            return path
        except Exception as exc:
            errors.append(f"unreadable: {path} ({exc})")
    raise FileNotFoundError(
        "No readable admin barangay shapefile found.\n" + "\n".join(errors)
    )


# Load Manila barangays, keep a number, and project to EPSG:32651.
def load_manila_admin() -> gpd.GeoDataFrame:
    global ADMIN_FILE
    ADMIN_FILE = resolve_admin_file()
    admin = gpd.read_file(ADMIN_FILE)
    brgy_col = find_first_existing_column(
        admin,
        ["adm4_name", "ADM4_EN", "adm4_en", "barangay"],
        "barangay",
    )
    city_candidates = ["adm3_name", "ADM3_EN", "adm3_en", "city"]
    city_col = next((c for c in city_candidates if c in admin.columns), None)
    keep_cols = [brgy_col, "geometry"]
    if city_col is not None:
        city_norm = (
            admin[city_col]
            .astype(str)
            .str.upper()
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
        )
        mask = city_norm.isin(["CITY OF MANILA", "MANILA"]) | city_norm.str.contains(
            "MANILA", na=False
        )
        admin = admin.loc[mask, keep_cols].copy()
    else:
        admin = admin[keep_cols].copy()
    admin = admin.rename(columns={brgy_col: "barangay"})
    admin["barangay"] = admin["barangay"].astype(str).str.strip()
    admin["barangay_no"] = admin["barangay"].apply(extract_barangay_number)
    if admin.crs is None:
        admin = admin.set_crs(epsg=4326)
    admin = admin.to_crs(epsg=AREA_EPSG)
    return admin


# Load one flood layer in EPSG:32651 and repair only invalid shapes.
def load_flood(path: str) -> gpd.GeoDataFrame:
    """Load flood layer. Avoid full-layer buffer(0) — too slow on LiPAD multipolygons."""
    require_file(path)
    print(f"  Reading {os.path.basename(path)} ...", flush=True)
    flood = gpd.read_file(path)
    if flood.crs is None:
        flood = flood.set_crs(epsg=4326)
    flood = flood.to_crs(epsg=AREA_EPSG)
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()
    # Light repair only where needed (not blanket buffer(0) on whole layer)
    invalid = ~flood.geometry.is_valid
    if invalid.any():
        print(f"    repairing {int(invalid.sum())} invalid flood feature(s)", flush=True)
        flood.loc[invalid, "geometry"] = flood.loc[invalid, "geometry"].apply(make_valid)
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()
    print(f"    features={len(flood)} total_bounds={flood.total_bounds}", flush=True)
    return flood


# Bounding box of the flood layer, without unioning every polygon.
def flood_extent_bounds(flood_gdf: gpd.GeoDataFrame):
    """Use total_bounds (fast) instead of unary_union (very slow on big multipolygons)."""
    if flood_gdf.empty:
        return (0.0, 0.0, 0.0, 0.0)
    return tuple(float(x) for x in flood_gdf.total_bounds)


# Test one barangay on the layers in its group and return one result row.
def evaluate_barangay(row, flood_layers: dict, layers_to_check: list[str],
                      extent_cache: dict) -> dict:
    name = row["barangay"]
    brgy_no = int(row["barangay_no"])
    geom = row.geometry

    valid_before = bool(geom.is_valid)
    geom_work = geom
    if not valid_before:
        geom_work = make_valid(geom) if geom is not None else None
        if geom_work is None or geom_work.is_empty:
            geom_work = geom.buffer(0) if geom is not None else None
    valid_after = bool(geom_work.is_valid) if geom_work is not None else False

    land_area = float(geom_work.area) if geom_work is not None else float("nan")

    within_all = True
    intersects_any = False
    total_inter_area = 0.0
    layer_notes = []

    for rp in layers_to_check:
        flood = flood_layers[rp]
        extent = extent_cache[rp]
        within = geom_within_extent(geom_work, extent) if geom_work is not None else False
        within_all = within_all and within

        intersects, inter_area, details = check_intersections(geom_work, flood)
        intersects_any = intersects_any or intersects
        total_inter_area += inter_area

        if details:
            detail_str = "; ".join(
                f"{rp}#idx={d['flood_feature_index']}: {d['intersection_area_sqm']:.6f} sqm"
                for d in details
            )
        else:
            detail_str = f"{rp}: no intersection"
        layer_notes.append(f"{rp}: within_extent={within}; {detail_str}")
        print(
            f"  [{name}] layer={rp} within_extent={within} "
            f"intersects={intersects} inter_area_sqm={inter_area:.6f}",
            flush=True,
        )

    conclusion = conclude(
        valid_before, valid_after, within_all, intersects_any, total_inter_area
    )

    return {
        "Barangay": name,
        "Barangay_No": brgy_no,
        "Check_Group": (
            "Group1_both_5yr_25yr_zero"
            if brgy_no in GROUP1_BOTH_ZERO
            else "Group2_5yr_only_zero"
        ),
        "Layers_Checked": "+".join(layers_to_check),
        "Geometry_Valid_Before": valid_before,
        "Geometry_Valid_After_Repair": valid_after,
        "Within_Flood_Layer_Extent": within_all,
        "Intersects_Any_Flood_Feature": intersects_any,
        "Intersection_Area_Sqm": total_inter_area,
        "Barangay_Land_Area_Sqm": land_area,
        "Layer_Detail": " | ".join(layer_notes),
        "Conclusion": conclusion,
    }


# Load the target numbers, compare them to the shapefiles, and save a CSV.
def main() -> int:
    print("=" * 72, flush=True)
    print("Zero-flood barangay spot check (read-only vs source shapefiles)", flush=True)
    print("=" * 72, flush=True)

    require_file(VALIDATED_CSV)
    validated = pd.read_csv(VALIDATED_CSV)
    if "barangay_no" not in validated.columns:
        raise ValueError(
            f"Expected 'barangay_no' in {VALIDATED_CSV}; got {list(validated.columns)}"
        )
    print("Join key confirmed from Validated CSV: barangay_no", flush=True)
    print(f"Validated CSV columns: {list(validated.columns)}", flush=True)

    targets = GROUP1_BOTH_ZERO + GROUP2_5YR_ONLY
    print(f"\nTargets: {targets}", flush=True)
    print(f"Group 1 (5yr+25yr): {GROUP1_BOTH_ZERO}", flush=True)
    print(f"Group 2 (5yr only): {GROUP2_5YR_ONLY}", flush=True)

    print("\nLoading Manila admin boundaries...", flush=True)
    admin = load_manila_admin()
    print(f"  Manila barangays loaded: {len(admin)}", flush=True)

    present = set(admin["barangay_no"].dropna().astype(int))
    missing = [n for n in targets if n not in present]
    if missing:
        raise ValueError(f"Target barangay_no not found in admin boundaries: {missing}")

    print("\nLoading flood layers (EPSG:32651)...", flush=True)
    flood_layers = {
        "5yr": load_flood(FLOOD_5YR),
        "25yr": load_flood(FLOOD_25YR),
    }
    extent_cache = {rp: flood_extent_bounds(gdf) for rp, gdf in flood_layers.items()}
    for rp, b in extent_cache.items():
        print(f"  {rp}: features={len(flood_layers[rp])} extent_bounds={b}", flush=True)

    results = []
    print("\n--- Per-barangay checks ---", flush=True)
    for brgy_no in targets:
        row = admin.loc[admin["barangay_no"] == brgy_no].iloc[0]
        layers = ["5yr", "25yr"] if brgy_no in GROUP1_BOTH_ZERO else ["5yr"]
        print(f"\nChecking {row['barangay']} (no={brgy_no}) against {layers}", flush=True)
        results.append(evaluate_barangay(row, flood_layers, layers, extent_cache))

    summary = pd.DataFrame(results)
    display_cols = [
        "Barangay",
        "Geometry_Valid_Before",
        "Geometry_Valid_After_Repair",
        "Within_Flood_Layer_Extent",
        "Intersects_Any_Flood_Feature",
        "Intersection_Area_Sqm",
        "Conclusion",
    ]

    print("\n" + "=" * 72, flush=True)
    print("SUMMARY TABLE", flush=True)
    print("=" * 72, flush=True)
    print(summary[display_cols].to_string(index=False), flush=True)

    summary.to_csv(OUT_CSV, index=False)
    print(f"\nSaved: {OUT_CSV}", flush=True)
    print(f"Rows written: {len(summary)}", flush=True)

    print("\nConclusion counts:", flush=True)
    print(summary["Conclusion"].value_counts().to_string(), flush=True)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except FileNotFoundError as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        sys.exit(2)
    except Exception as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        raise
