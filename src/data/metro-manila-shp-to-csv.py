import os
import re
import warnings
import pandas as pd
import geopandas as gpd

try:
    import geopandas as gpd
    import pandas as pd
    import os
except Exception:
    print("Missing required Python packages (geopandas, pandas, etc.).")
    print("Install using conda (recommended) or pip. See README.md for details.")
    raise


# ============================================================
# CONFIGURATION
# ============================================================

script_dir = os.path.dirname(os.path.abspath(__file__))

admin_file = os.path.join(script_dir, "phl_admin4.shp")

flood_files = {
    "5yr": os.path.join(script_dir, "MetroManila_Flood_5year.shp"),
    "25yr": os.path.join(script_dir, "MetroManila_Flood_25year.shp"),
    "100yr": os.path.join(script_dir, "MetroManila_Flood_100year.shp"),
}

output_csv = os.path.join(script_dir, "MetroManila_Barangay_Flood_Area_Validated.csv")
validation_report_csv = os.path.join(script_dir, "MetroManila_Flood_Validation_Report.csv")
missing_barangays_csv = os.path.join(script_dir, "MetroManila_Missing_Barangay_Numbers.csv")
special_rows_csv = os.path.join(script_dir, "MetroManila_Special_NonBarangay_Rows.csv")
layer_diagnostics_csv = os.path.join(script_dir, "MetroManila_Flood_Layer_Diagnostics.csv")

CITY_FILTER = "CITY OF MANILA"   # set None for all NCR
AREA_EPSG = 32651

# If True, removes rows like Manila North Cemetery and Tutuban Mall.
# Keeps rows that look like:
# Barangay 1
# Barangay 202-A
# Barangay 587-A
KEEP_ONLY_NUMBERED_BARANGAYS = True

# Expected barangay number range for Manila.
# Adjust if your official reference differs.
EXPECTED_MIN_BARANGAY_NO = 1
EXPECTED_MAX_BARANGAY_NO = 905

# Tolerance for floating-point comparisons.
EPS = 1e-6

# If flood shapefiles contain a no-hazard class, set this to True
# and configure HAZARD_FILTER_RULES below.
APPLY_HAZARD_ATTRIBUTE_FILTER = False

# Optional hazard filtering.
# You must inspect your shapefile columns first.
#
# Examples:
# HAZARD_FILTER_RULES = {
#     "gridcode": lambda s: s > 0
# }
#
# HAZARD_FILTER_RULES = {
#     "Var": lambda s: s.astype(str).str.upper().isin(["LOW", "MEDIUM", "HIGH"])
# }
#
# If no matching column is found, no filtering is applied.
HAZARD_FILTER_RULES = {
    # "gridcode": lambda s: s > 0,
    # "HAZ": lambda s: s > 0,
    # "hazard": lambda s: s.astype(str).str.upper().isin(["LOW", "MEDIUM", "HIGH"]),
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def find_first_existing_column(df, candidates, label):
    col = next((c for c in candidates if c in df.columns), None)
    if not col:
        raise ValueError(f"Could not find {label} column in {list(df.columns)}")
    return col


def is_numbered_barangay(name):
    """
    Keeps:
    - Barangay 1
    - Barangay 202-A
    - Barangay 587-A

    Excludes:
    - Manila North Cemetery
    - Tutuban Mall (...)
    """
    if pd.isna(name):
        return False
    text = str(name).strip()
    return bool(re.fullmatch(r"Barangay\s+\d+(-[A-Z])?", text, flags=re.IGNORECASE))


def extract_barangay_number(name):
    """
    Extracts numeric part from Barangay names.
    Barangay 202-A -> 202
    Barangay 1 -> 1
    """
    if pd.isna(name):
        return None
    match = re.search(r"Barangay\s+(\d+)", str(name), flags=re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def inspect_layer(path, rp):
    """
    Reads flood layer metadata for diagnostics.
    """
    flood_raw = gpd.read_file(path)

    diagnostics = {
        "return_period": rp,
        "file": os.path.basename(path),
        "crs": str(flood_raw.crs),
        "feature_count": len(flood_raw),
        "geometry_types": "; ".join(
            [f"{k}:{v}" for k, v in flood_raw.geom_type.value_counts(dropna=False).to_dict().items()]
        ),
        "columns": "; ".join(list(flood_raw.columns)),
    }

    return flood_raw, diagnostics


def apply_hazard_filter(flood, rp):
    """
    Optionally filters hazard polygons based on attribute rules.
    Useful if shapefile contains no-hazard polygons or hazard classes.
    """
    if not APPLY_HAZARD_ATTRIBUTE_FILTER:
        return flood, "No attribute filter applied"

    if not HAZARD_FILTER_RULES:
        return flood, "Filter enabled but no HAZARD_FILTER_RULES configured"

    for col, rule_func in HAZARD_FILTER_RULES.items():
        if col in flood.columns:
            before = len(flood)
            mask = rule_func(flood[col])
            flood = flood.loc[mask].copy()
            after = len(flood)
            return flood, f"Applied filter on '{col}': {before} -> {after} features"

    return flood, "Filter enabled but no configured hazard column found"


def union_flood_geometries(flood, crs):
    """
    Dissolves/union flood polygons into one geometry to avoid double-counting
    overlapping polygons.
    """
    if flood.empty:
        return gpd.GeoDataFrame(geometry=[], crs=crs)

    # Repair invalid geometries where possible
    flood["geometry"] = flood.geometry.buffer(0)
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()

    if flood.empty:
        return gpd.GeoDataFrame(geometry=[], crs=crs)

    try:
        # GeoPandas/Shapely 2.x
        union_geom = flood.geometry.union_all()
    except AttributeError:
        # Older Shapely fallback
        union_geom = flood.geometry.unary_union

    if union_geom is None or union_geom.is_empty:
        return gpd.GeoDataFrame(geometry=[], crs=crs)

    return gpd.GeoDataFrame(geometry=[union_geom], crs=crs)


# ============================================================
# LOAD ADMIN BOUNDARIES
# ============================================================

print("Loading admin shapefile...")
admin = gpd.read_file(admin_file)

brgy_col = find_first_existing_column(
    admin,
    ["adm4_name", "ADM4_EN", "adm4_en", "barangay"],
    "barangay"
)

if CITY_FILTER:
    city_col = find_first_existing_column(
        admin,
        ["adm3_name", "ADM3_EN", "adm3_en", "city"],
        "city"
    )

    admin = admin.loc[
        admin[city_col].astype(str).str.upper().str.strip() == CITY_FILTER.upper(),
        [brgy_col, "geometry"]
    ].copy()

    print(f"Filtered to {len(admin)} rows in {CITY_FILTER}")
else:
    admin = admin[[brgy_col, "geometry"]].copy()

admin = admin.rename(columns={brgy_col: "barangay"})
admin["barangay"] = admin["barangay"].astype(str).str.strip()

# Save and optionally remove special non-barangay rows
special_rows = admin.loc[~admin["barangay"].apply(is_numbered_barangay)].copy()
if not special_rows.empty:
    special_rows.drop(columns="geometry").to_csv(special_rows_csv, index=False)
    print(f"Special/non-barangay rows found: {len(special_rows)}")
    print(f"Saved special rows report: {special_rows_csv}")

if KEEP_ONLY_NUMBERED_BARANGAYS:
    before = len(admin)
    admin = admin.loc[admin["barangay"].apply(is_numbered_barangay)].copy()
    after = len(admin)
    print(f"Kept only numbered barangays: {before} -> {after}")

# Check duplicates
duplicate_barangays = admin[admin["barangay"].duplicated(keep=False)]
if not duplicate_barangays.empty:
    print("WARNING: Duplicate barangay names found in admin boundary:")
    print(duplicate_barangays[["barangay"]].sort_values("barangay"))

# Reproject once and compute barangay areas
admin = admin.to_crs(epsg=AREA_EPSG)
admin["geometry"] = admin.geometry.buffer(0)
admin["brgy_area_sqm"] = admin.geometry.area

# Create Manila boundary for clipping flood layers first
manila_boundary = admin.dissolve()[["geometry"]].copy()

# Base result table without geometry
result = pd.DataFrame({
    "barangay": admin["barangay"].values,
    "brgy_area_sqm": admin["brgy_area_sqm"].values,
})

layer_diagnostics = []


# ============================================================
# PROCESS EACH FLOOD RETURN PERIOD
# ============================================================

for rp, flood_path in flood_files.items():
    print(f"\nProcessing {rp}: {flood_path}")

    if not os.path.exists(flood_path):
        raise FileNotFoundError(f"Flood shapefile not found: {flood_path}")

    # Read full layer first so attributes are available for inspection/filtering
    flood, diag = inspect_layer(flood_path, rp)
    layer_diagnostics.append(diag)

    print(f"Layer columns for {rp}: {list(flood.columns)}")
    print(f"Layer CRS for {rp}: {flood.crs}")
    print(f"Feature count before cleaning: {len(flood)}")

    # Reproject to match admin
    flood = flood.to_crs(admin.crs)

    # Remove empty/null geometries early
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()

    # Optional attribute filtering
    flood, filter_note = apply_hazard_filter(flood, rp)
    print(filter_note)

    # Repair invalid geometries
    flood["geometry"] = flood.geometry.buffer(0)
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()

    # Clip flood polygons to Manila boundary
    flood = gpd.clip(flood, manila_boundary)

    if flood.empty:
        result[f"flood_area_{rp}_sqm"] = 0.0
        result[f"flood_pct_{rp}"] = 0.0
        continue

    # IMPORTANT:
    # Dissolve/union flood geometries to avoid double-counting overlapping polygons.
    flood_union = union_flood_geometries(flood, admin.crs)

    if flood_union.empty:
        result[f"flood_area_{rp}_sqm"] = 0.0
        result[f"flood_pct_{rp}"] = 0.0
        continue

    # Spatial join only on unioned flood geometry
    joined = gpd.sjoin(
        flood_union,
        admin[["barangay", "geometry"]],
        how="inner",
        predicate="intersects"
    )

    if joined.empty:
        flood_by_brgy = pd.DataFrame(columns=["barangay", f"flood_area_{rp}_sqm"])
    else:
        # Since flood_union has one geometry, intersect it with candidate barangays
        flood_geoms = joined.geometry.reset_index(drop=True)
        admin_geoms = admin.loc[joined["index_right"], "geometry"].reset_index(drop=True)

        inter_area = flood_geoms.intersection(admin_geoms).area

        joined = joined.reset_index(drop=True)
        joined["barangay"] = admin.loc[joined["index_right"], "barangay"].reset_index(drop=True).values
        joined[f"flood_area_{rp}_sqm"] = inter_area.values

        flood_by_brgy = joined.groupby("barangay", as_index=False)[f"flood_area_{rp}_sqm"].sum()

    result = result.merge(flood_by_brgy, on="barangay", how="left")
    result[f"flood_area_{rp}_sqm"] = result[f"flood_area_{rp}_sqm"].fillna(0.0)

    # Prevent flood area from exceeding barangay area due to geometry precision/artifacts
    result[f"flood_area_{rp}_sqm"] = result[f"flood_area_{rp}_sqm"].clip(
        lower=0,
        upper=result["brgy_area_sqm"]
    )

    result[f"flood_pct_{rp}"] = (
        result[f"flood_area_{rp}_sqm"] / result["brgy_area_sqm"] * 100
    ).clip(lower=0, upper=100)


# ============================================================
# FINAL OUTPUT
# ============================================================

final_cols = ["barangay", "brgy_area_sqm"]
for rp in flood_files:
    final_cols += [f"flood_area_{rp}_sqm", f"flood_pct_{rp}"]

final = result[final_cols].sort_values("barangay").reset_index(drop=True)


# ============================================================
# VALIDATION CHECKS
# ============================================================

print("\nRunning validation checks...")

validation_rows = []

# 1. Area checks
for rp in flood_files:
    area_col = f"flood_area_{rp}_sqm"
    pct_col = f"flood_pct_{rp}"

    exceeds_area = final[final[area_col] > final["brgy_area_sqm"] + EPS]
    below_zero_area = final[final[area_col] < -EPS]
    pct_above_100 = final[final[pct_col] > 100 + EPS]
    pct_below_0 = final[final[pct_col] < -EPS]

    validation_rows.append({
        "check": f"{rp}: flood area exceeds barangay area",
        "count": len(exceeds_area)
    })
    validation_rows.append({
        "check": f"{rp}: flood area below zero",
        "count": len(below_zero_area)
    })
    validation_rows.append({
        "check": f"{rp}: flood pct above 100",
        "count": len(pct_above_100)
    })
    validation_rows.append({
        "check": f"{rp}: flood pct below 0",
        "count": len(pct_below_0)
    })

# 2. Monotonicity checks
if {"5yr", "25yr"}.issubset(flood_files.keys()):
    final["flag_25yr_less_than_5yr"] = final["flood_pct_25yr"] + EPS < final["flood_pct_5yr"]
    validation_rows.append({
        "check": "25yr flood pct lower than 5yr flood pct",
        "count": int(final["flag_25yr_less_than_5yr"].sum())
    })

if {"25yr", "100yr"}.issubset(flood_files.keys()):
    final["flag_100yr_less_than_25yr"] = final["flood_pct_100yr"] + EPS < final["flood_pct_25yr"]
    validation_rows.append({
        "check": "100yr flood pct lower than 25yr flood pct",
        "count": int(final["flag_100yr_less_than_25yr"].sum())
    })

if {"5yr", "100yr"}.issubset(flood_files.keys()):
    final["flag_100yr_less_than_5yr"] = final["flood_pct_100yr"] + EPS < final["flood_pct_5yr"]
    validation_rows.append({
        "check": "100yr flood pct lower than 5yr flood pct",
        "count": int(final["flag_100yr_less_than_5yr"].sum())
    })

# 3. Missing barangay number check
final["barangay_no"] = final["barangay"].apply(extract_barangay_number)

present_nums = set(final["barangay_no"].dropna().astype(int).tolist())
expected_nums = set(range(EXPECTED_MIN_BARANGAY_NO, EXPECTED_MAX_BARANGAY_NO + 1))
missing_nums = sorted(expected_nums - present_nums)

missing_df = pd.DataFrame({"missing_barangay_number": missing_nums})
missing_df.to_csv(missing_barangays_csv, index=False)

validation_rows.append({
    "check": f"Missing barangay numbers from {EXPECTED_MIN_BARANGAY_NO} to {EXPECTED_MAX_BARANGAY_NO}",
    "count": len(missing_nums)
})

# Save validation summary
validation_report = pd.DataFrame(validation_rows)
validation_report.to_csv(validation_report_csv, index=False)

# Save layer diagnostics
pd.DataFrame(layer_diagnostics).to_csv(layer_diagnostics_csv, index=False)

# Save final result
final.to_csv(output_csv, index=False)

print(f"\nDone. Saved final output: {output_csv}")
print(f"Saved validation report: {validation_report_csv}")
print(f"Saved missing barangay number report: {missing_barangays_csv}")
print(f"Saved layer diagnostics: {layer_diagnostics_csv}")

if not special_rows.empty:
    print(f"Saved special/non-barangay rows report: {special_rows_csv}")

print("\nValidation Summary:")
print(validation_report)

# Show problematic monotonic rows if present
flag_cols = [c for c in final.columns if c.startswith("flag_")]
if flag_cols:
    problem_rows = final[final[flag_cols].any(axis=1)]
    print(f"\nRows with monotonicity issues: {len(problem_rows)}")

    if len(problem_rows) > 0:
        print(problem_rows[[
            "barangay",
            "flood_pct_5yr",
            "flood_pct_25yr",
            "flood_pct_100yr"
        ] + flag_cols].head(30))

print("\nPreview:")
print(final.head(10))