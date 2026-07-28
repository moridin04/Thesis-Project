from src.barangay_flood_risk_modeling import calculate_indices


def preprocess_data(dataframe):
    """Prepare data up to deterministic index creation."""
    return calculate_indices(dataframe)
