# Forwards the dataframe to run_ml_pipeline.
# This file does not train a classifier by itself.
from src.barangay_flood_risk_modeling import run_ml_pipeline


# Call the full modeling pipeline and return what it returns.
def run_classification(dataframe):
    """Execute the pipeline and expose classification outputs."""
    return run_ml_pipeline(dataframe)
