from src.barangay_flood_risk_modeling import run_ml_pipeline


def run_clustering(dataframe):
    """Run the full ML pipeline and return the enriched dataframe."""
    return run_ml_pipeline(dataframe)
