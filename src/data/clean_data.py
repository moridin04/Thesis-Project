from src.barangay_flood_risk_modeling import engineer_features


def clean_data(dataframe):
    """Apply the project feature-engineering cleanup steps."""
    return engineer_features(dataframe)
