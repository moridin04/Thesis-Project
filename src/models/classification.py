from src.barangay_flood_risk_modeling import run_ml_pipeline


def run_classification(dataframe):
    """Execute the pipeline and expose classification outputs."""
    return run_ml_pipeline(dataframe)
