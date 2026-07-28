from src.barangay_flood_risk_modeling import run_ml_pipeline


def run_regression(dataframe):
    """Execute the pipeline and expose regression outputs."""
    return run_ml_pipeline(dataframe)
