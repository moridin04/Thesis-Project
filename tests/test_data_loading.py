from pathlib import Path

from src.data.load_data import load_data


def test_load_data_reads_interim_dataset():
    dataset = Path('data/interim/MetroManila_Combined_Flood_Population-new.csv')
    dataframe = load_data(str(dataset))
    assert not dataframe.empty
    assert 'Name' in dataframe.columns
