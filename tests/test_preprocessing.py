import pandas as pd

from src.data.preprocess_data import preprocess_data


def test_preprocess_data_adds_indices():
    dataframe = pd.DataFrame({
        'Name': ['A'],
        'City': ['Metro'],
        'Land Area': [100.0],
        'Population': [50],
        'flood5_sqm_final': [10.0],
        'flood25_sqm_final': [20.0],
        'flood100_sqm_final': [30.0],
    })
    result = preprocess_data(dataframe)
    assert {'CSI', 'DPI', 'Pop_Density'}.issubset(result.columns)
