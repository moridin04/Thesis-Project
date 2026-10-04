# Paths used by src.main.
# This file is in src/utils, so parents[2] is the repository root.
# INTERIM_DATA_FILE is the flood and population CSV the pipeline loads.
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / 'data'
RAW_DATA_DIR = DATA_DIR / 'raw'
INTERIM_DATA_DIR = DATA_DIR / 'interim'
PROCESSED_DATA_DIR = DATA_DIR / 'processed'
MODELS_DIR = PROJECT_ROOT / 'models'
REPORTS_DIR = PROJECT_ROOT / 'reports'
INTERIM_DATA_FILE = INTERIM_DATA_DIR / 'MetroManila_Combined_Flood_Population-new.csv'
