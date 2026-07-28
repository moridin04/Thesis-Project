# Setup Instructions

## pip

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## conda

```bash
conda env create -f environment/environment.yml
conda activate thesis-project
```

## Notes

- Install Git LFS before committing large binaries or shapefiles.
- Keep raw geospatial assets in `data/raw/` and generated outputs in `reports/`.
