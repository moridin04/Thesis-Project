Manila Barangay Flood Risk Complete Pipeline

Files Needed

Because the shape-to-CSV/geospatial processing was completed separately in QGIS, this notebook now requires only tabular inputs:

1. `MetroManila_Barangay_Flood_Area_Validated.csv` — QGIS-prepared flood area and flood percentage table.
2. `population-dataset-2024.csv` — PSA 2024 barangay population estimates.
3. `population-dataset-2020.xlsx` — PSA 2020 barangay population table.
4. `manila_final_base_dataset_NEW.csv` — administrative/base barangay metadata.
5. `manila_barangay_elevation.csv` — required QGIS Zonal Statistics output containing barangay-level DEM/DTM elevation statistics.

Dashboard File Set:
barangay_flood_risk_predictions.csv
manila_barangay_risk_map.geojson
model_comparison_results.csv
entropy_component_weights.csv
feature_importance_gradient_boosting.csv
permutation_feature_importance.csv
Manila_Barangay_Flood_Risk_Comprehensive_Report_READABLE.pdf

Optional for Admin/Debug Pages: 
dpi_component_class_summary.csv - summary table by Low/Medium/High
top_rank_explanation.csv - top 25 explanation table
high_dpi_moderate_flood_audit.csv - explains exposure-driven high ranks
elevation_outlier_audit.csv - shows elevation anomalies
population_change_sensitivity_audit.csv - shows robustness checks
