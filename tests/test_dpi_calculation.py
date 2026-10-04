# Check calculate_dpi on one made-up barangay.
# That function only calls calculate_indices. The test expects DPI above 0.
import pandas as pd

from src.features.calculate_dpi import calculate_dpi


# One row with population and flood area should get a DPI above 0.
def test_calculate_dpi_returns_positive_score():
    dataframe = pd.DataFrame({
        'Name': ['A'],
        'City': ['Metro'],
        'Land Area': [100.0],
        'Population': [100],
        'flood5_sqm_final': [50.0],
        'flood25_sqm_final': [60.0],
        'flood100_sqm_final': [80.0],
    })
    result = calculate_dpi(dataframe)
    assert result.loc[0, 'DPI'] > 0
