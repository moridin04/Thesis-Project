# Check that the interim CSV loads and that it has a Name column.
from pathlib import Path

from src.data.load_data import load_data


# Read the interim flood-population file and confirm it is not empty.
def test_load_data_reads_interim_dataset():
    dataset = Path('data/interim/MetroManila_Combined_Flood_Population-new.csv')
    dataframe = load_data(str(dataset))
    assert not dataframe.empty
    assert 'Name' in dataframe.columns
