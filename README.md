# Thesis-Project

Comparative Analysis of Random Forest, Gradient Boosting, and Multi-Layer Perceptron Models for Flood Risk Level Classification in Selected Barangays of the National Capital Region in the Philippines.

## Repository layout

This repository is organized as a reproducible thesis project with:

- `docs/` for manuscript chapters and supporting documentation
- `data/` for raw, interim, processed, and external datasets
- `notebooks/` for exploratory and modeling notebooks
- `src/` for the reusable Python package and pipeline modules
- `models/` for serialized trained models
- `reports/` for generated figures, tables, and final outputs
- `scripts/` for command-line execution helpers
- `tests/` for lightweight regression checks
- `environment/` for setup notes and environment definitions

## Quick start

```bash
make test
make run-pipeline
```

## Notes

- Large geospatial assets and final binary report artifacts should be tracked outside normal Git history when appropriate.
- See `docs/git_lfs.md` and `environment/setup_instructions.md` for storage and setup guidance.
