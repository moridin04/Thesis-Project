# Check that run_ml_pipeline adds Predicted_Risk_Class and Predicted_DPI.
# Eighteen fake rows give the split more than one risk class to work with.
import pandas as pd

from src.barangay_flood_risk_modeling import run_ml_pipeline


# Score the fake rows, run the pipeline, and look for both columns.
def test_run_ml_pipeline_adds_prediction_columns():
    rows = []
    for i in range(6):
        rows.append({
            'Name': f'Low-{i}',
            'City': f'City-{i % 3}',
            'Land Area': 1000.0,
            'Population': 10,
            'flood5_sqm_final': 0.0,
            'flood25_sqm_final': 0.0,
            'flood100_sqm_final': 0.0,
        })
    for i in range(6):
        rows.append({
            'Name': f'Moderate-{i}',
            'City': f'City-{i % 3}',
            'Land Area': 1000.0,
            'Population': 30,
            'flood5_sqm_final': 100.0,
            'flood25_sqm_final': 250.0,
            'flood100_sqm_final': 300.0,
        })
    for i in range(6):
        rows.append({
            'Name': f'High-{i}',
            'City': f'City-{i % 3}',
            'Land Area': 1000.0,
            'Population': 90,
            'flood5_sqm_final': 600.0,
            'flood25_sqm_final': 800.0,
            'flood100_sqm_final': 900.0,
        })
    dataframe = pd.DataFrame(rows)
    from src.barangay_flood_risk_modeling import calculate_indices
    dataframe = calculate_indices(dataframe)
    result, _ = run_ml_pipeline(dataframe)
    assert 'Predicted_Risk_Class' in result.columns
    assert 'Predicted_DPI' in result.columns
