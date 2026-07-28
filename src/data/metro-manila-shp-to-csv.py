import os
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

script_dir = os.path.dirname(os.path.abspath(__file__))

admin_file = os.path.join(script_dir, "phl_admin4.shp")

flood_files = {
    "5yr": os.path.join(script_dir, "MetroManila_Flood_5year.shp"),
    "25yr": os.path.join(script_dir, "MetroManila_Flood_25year.shp"),
}

output_csv = os.path.join(script_dir, "MetroManila_Barangay_Flood_Area.csv")

CITY_FILTER = "CITY OF MANILA"   # set None for all
AREA_EPSG = 32651

print("Loading admin shapefile...")
admin = gpd.read_file(admin_file)

# Find required columns
brgy_col = next((c for c in ["adm4_name", "ADM4_EN", "adm4_en", "barangay"] if c in admin.columns), None)
if not brgy_col:
    raise ValueError(f"Could not find barangay column in {list(admin.columns)}")

if CITY_FILTER:
    city_col = next((c for c in ["adm3_name", "ADM3_EN", "adm3_en", "city"] if c in admin.columns), None)
    if not city_col:
        raise ValueError(f"Could not find city column in {list(admin.columns)}")

    admin = admin.loc[
        admin[city_col].astype(str).str.upper().str.strip() == CITY_FILTER.upper(),
        [brgy_col, "geometry"]
    ].copy()
    print(f"Filtered to {len(admin)} barangays in {CITY_FILTER}")
else:
    admin = admin[[brgy_col, "geometry"]].copy()

# Reproject once and compute barangay areas
admin = admin.to_crs(epsg=AREA_EPSG)
admin["brgy_area_sqm"] = admin.geometry.area

# Create Manila boundary for clipping flood layers first
manila_boundary = admin.dissolve()[["geometry"]].copy()

# Base result table without geometry
result = pd.DataFrame({
    "barangay": admin[brgy_col].values,
    "brgy_area_sqm": admin["brgy_area_sqm"].values,
})

# Process each return period
for rp, flood_path in flood_files.items():
    print(f"\nProcessing {rp}: {flood_path}")

    # Read only geometry
    flood = gpd.read_file(flood_path)[["geometry"]].copy()

    # Reproject to match admin
    flood = flood.to_crs(admin.crs)

    # Remove empty/null geometries early
    flood = flood.loc[flood.geometry.notna() & ~flood.geometry.is_empty].copy()

    # Clip flood polygons to Manila boundary first
    flood = gpd.clip(flood, manila_boundary)

    if flood.empty:
        result[f"flood_area_{rp}_sqm"] = 0.0
        result[f"flood_pct_{rp}"] = 0.0
        continue

    # Spatial join only on clipped flood data
    joined = gpd.sjoin(
        flood,
        admin[[brgy_col, "geometry"]],
        how="inner",
        predicate="intersects"
    )

    if joined.empty:
        flood_by_brgy = pd.DataFrame(columns=["barangay", f"flood_area_{rp}_sqm"])
    else:
        # Intersect only candidate pairs
        flood_geoms = joined.geometry.reset_index(drop=True)
        admin_geoms = admin.loc[joined["index_right"], "geometry"].reset_index(drop=True)

        inter_area = flood_geoms.intersection(admin_geoms).area

        joined = joined.reset_index(drop=True)
        joined["barangay"] = admin.loc[joined["index_right"], brgy_col].reset_index(drop=True).values
        joined[f"flood_area_{rp}_sqm"] = inter_area.values

        flood_by_brgy = joined.groupby("barangay", as_index=False)[f"flood_area_{rp}_sqm"].sum()

    result = result.merge(flood_by_brgy, on="barangay", how="left")
    result[f"flood_area_{rp}_sqm"] = result[f"flood_area_{rp}_sqm"].fillna(0.0)
    result[f"flood_pct_{rp}"] = result[f"flood_area_{rp}_sqm"] / result["brgy_area_sqm"] * 100

# Final output
final_cols = ["barangay", "brgy_area_sqm"]
for rp in flood_files:
    final_cols += [f"flood_area_{rp}_sqm", f"flood_pct_{rp}"]

final = result[final_cols].sort_values("barangay").reset_index(drop=True)
final.to_csv(output_csv, index=False)

print(f"\nDone. Saved: {output_csv}")
print(final.head(10))
