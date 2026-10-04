# Calls calculate_indices from barangay_flood_risk_modeling.
# CSI and DPI are added in that function. This file only returns its table.
from src.barangay_flood_risk_modeling import calculate_indices


# Pass the dataframe to calculate_indices and return the result.
def calculate_dpi(dataframe):
    """Return the dataframe with CSI and DPI columns added."""
    return calculate_indices(dataframe)
