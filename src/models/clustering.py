# Forwards the dataframe to run_ml_pipeline.
# K-means lives in that function. This file does not cluster by itself.
from src.barangay_flood_risk_modeling import run_ml_pipeline


# Call the full modeling pipeline and return what it returns.
def run_clustering(dataframe):
    """Run the full ML pipeline and return the enriched dataframe."""
    return run_ml_pipeline(dataframe)
