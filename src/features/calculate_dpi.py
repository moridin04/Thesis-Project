from src.barangay_flood_risk_modeling import calculate_indices


def calculate_dpi(dataframe):
    """Return the dataframe with CSI and DPI columns added."""
    return calculate_indices(dataframe)
