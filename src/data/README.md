Setup
-----

Conda (recommended):

```bash
conda create -n shp2csv python=3.10 -y
conda activate shp2csv
conda install -c conda-forge geopandas rtree fiona pyproj shapely pandas -y
python metro-manila-shp-to-csv.py
```

Pip (Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install geopandas rtree fiona pyproj shapely pandas
python metro-manila-shp-to-csv.py
```

If you already have an existing virtualenv (`.venv`), activate it then run the `pip install` line.
