# Folder locations for data, docs, models, and reports.
# This file is in src, so parents[1] is the repository root.
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / 'data'
DOCS_DIR = PROJECT_ROOT / 'docs'
MODELS_DIR = PROJECT_ROOT / 'models'
REPORTS_DIR = PROJECT_ROOT / 'reports'
