# Staff model-results page. The numbers come from the pipeline's saved CSVs.
# The selected model is the row with the highest mean CV F1-macro.
# Importance lists keep the top 10 of the 11 thesis predictors.
# This file does not refit a model or compute DPI.
# get_model_summary is the smaller card the public overview is allowed to show.

from __future__ import annotations

import ast
from functools import lru_cache
from pathlib import Path

import pandas as pd

# Notebook Output folder. parents[3] is the repo root.
OUTPUT_DIR = Path(__file__).resolve().parents[3] / "src" / "ML-thesis-updated" / "Output"
# One row per trained model. Selection uses CV_F1_Macro_Mean from here.
MODEL_COMPARISON_CSV = OUTPUT_DIR / "model_comparison_results.csv"
# Random forest impurity importance. The file should name one model.
RF_IMPORTANCE_CSV = OUTPUT_DIR / "feature_importance_random_forest.csv"
# Gradient boosting impurity importance. The file should name one model.
GB_IMPORTANCE_CSV = OUTPUT_DIR / "feature_importance_gradient_boosting.csv"
# Permutation importance on held-out rows, for one model.
PERMUTATION_IMPORTANCE_CSV = OUTPUT_DIR / "permutation_feature_importance.csv"
# Optional. If this file is missing, the matrices stay empty and the page still loads.
CONFUSION_MATRICES_CSV = OUTPUT_DIR / "confusion_matrices.csv"

# Priority labels. Per-class columns and the test-size check use these names.
CLASSES = ("Low", "Medium", "High")
# How many features each importance list keeps, highest score first.
TOP_N = 10

# Display label and component group for the 11 predictors. Other names are rejected.
FEATURE_META: dict[str, dict[str, str]] = {
    "Flood_PCT_5yr": {"label": "Flood coverage (5-yr, %)", "group": "Hazard"},
    "Flood_PCT_25yr": {"label": "Flood coverage (25-yr, %)", "group": "Hazard"},
    "Flood_Escalation_5to25": {"label": "Flood escalation (5-yr to 25-yr)", "group": "Hazard"},
    "Flood_Severity_Increase_5to25_Sqm": {
        "label": "Flooded area increase (5-yr to 25-yr, sq m)",
        "group": "Hazard",
    },
    "Population_2024": {"label": "Population (2024)", "group": "Exposure"},
    "Affected_Population_5yr": {"label": "Affected population (5-yr)", "group": "Exposure"},
    "Affected_Population_25yr": {"label": "Affected population (25-yr)", "group": "Exposure"},
    "Affected_Population_Increase_5to25": {
        "label": "Affected population increase (5-yr to 25-yr)",
        "group": "Exposure",
    },
    "Population_Density_per_Hectare": {
        "label": "Population density (per hectare)",
        "group": "Vulnerability",
    },
    "Population_Change_2020_2024_Pct": {
        "label": "Population change 2020-2024 (%)",
        "group": "Vulnerability",
    },
    "Elevation_Mean": {"label": "Mean elevation (m)", "group": "Vulnerability"},
}

# Required comparison columns, including Precision, Recall, F1, and Support per class.
MODEL_COMPARISON_COLUMNS = [
    "Model",
    "CV_F1_Macro_Mean",
    "CV_F1_Macro_Std",
    "Best_Params",
    "Accuracy",
    "Balanced_Accuracy",
    "F1_Macro",
    "F1_Weighted",
    "ROC_AUC_OVR_Macro",
] + [f"{metric}_{cls}" for cls in CLASSES for metric in ("Precision", "Recall", "F1", "Support")]
# Columns required in the two impurity-importance files.
IMPORTANCE_COLUMNS = ["Feature", "Importance", "Model"]
# Feature, mean, spread, and model name required in the permutation file.
PERMUTATION_COLUMNS = [
    "Feature",
    "Permutation_Importance_Mean",
    "Permutation_Importance_Std",
    "Model",
]
# Long form: one actual and predicted pair, plus how many rows fell in that cell.
CONFUSION_COLUMNS = ["Model", "Actual", "Predicted", "Count"]


# Load one results CSV and stop if a column this page needs is missing.
def _read_csv(path: Path, required: list[str]) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"ML results file not found: {path}")
    frame = pd.read_csv(path)
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise ValueError(f"{path.name} is missing required columns: {missing}")
    return frame


# A blank cell stays null. ROC-AUC and the permutation std both allow that.
def _optional_float(value) -> float | None:
    return None if pd.isna(value) else float(value)


# Best_Params is a dict printed as text. literal_eval reads it, then we drop model__.
def _best_params(raw) -> dict:
    if pd.isna(raw) or not str(raw).strip():
        return {}
    params = ast.literal_eval(str(raw))
    if not isinstance(params, dict):
        raise ValueError(f"Best_Params is not a dictionary: {raw!r}")
    return {str(key).removeprefix("model__"): value for key, value in params.items()}


# Attach the thesis label and group. An unknown feature name is an error.
def _feature_item(feature: str, importance: float, std: float | None = None) -> dict:
    meta = FEATURE_META.get(feature)
    if meta is None:
        raise ValueError(f"Feature {feature!r} is not one of the 11 thesis predictors.")
    return {
        "feature": feature,
        "label": meta["label"],
        "group": meta["group"],
        "importance": float(importance),
        "std": std,
    }


# One record per model. selected follows mean CV F1-macro, not the test F1.
def _models(frame: pd.DataFrame) -> tuple[list[dict], str, int]:
    if frame.empty:
        raise ValueError(f"{MODEL_COMPARISON_CSV.name} has no model rows.")
    # idxmax keeps the earliest row if two models share the same mean.
    selected = str(frame.loc[frame["CV_F1_Macro_Mean"].idxmax(), "Model"])

    # Support columns are the held-out counts. Every model must report the same total.
    test_sizes = {int(sum(row[f"Support_{cls}"] for cls in CLASSES)) for _, row in frame.iterrows()}
    if len(test_sizes) != 1:
        raise ValueError(f"Models report different test-set sizes: {sorted(test_sizes)}")

    models = []
    for _, row in frame.iterrows():
        models.append(
            {
                "model": str(row["Model"]),
                "selected": str(row["Model"]) == selected,
                "cv_f1_macro_mean": float(row["CV_F1_Macro_Mean"]),
                "cv_f1_macro_std": float(row["CV_F1_Macro_Std"]),
                "best_params": _best_params(row["Best_Params"]),
                "accuracy": float(row["Accuracy"]),
                "balanced_accuracy": float(row["Balanced_Accuracy"]),
                "f1_macro": float(row["F1_Macro"]),
                "f1_weighted": float(row["F1_Weighted"]),
                "roc_auc_ovr_macro": _optional_float(row["ROC_AUC_OVR_Macro"]),
                "per_class": {
                    cls: {
                        "precision": float(row[f"Precision_{cls}"]),
                        "recall": float(row[f"Recall_{cls}"]),
                        "f1": float(row[f"F1_{cls}"]),
                        "support": int(row[f"Support_{cls}"]),
                    }
                    for cls in CLASSES
                },
            }
        )
    return models, selected, test_sizes.pop()


# Top features by impurity score for the single model named in the file.
def _importance(path: Path) -> tuple[str, list[dict]]:
    frame = _read_csv(path, IMPORTANCE_COLUMNS)
    models = frame["Model"].dropna().unique()
    if len(models) != 1:
        raise ValueError(f"{path.name} should describe exactly one model; found {list(models)}")
    top = frame.sort_values("Importance", ascending=False).head(TOP_N)
    return str(models[0]), [_feature_item(r["Feature"], r["Importance"]) for _, r in top.iterrows()]


# Same top cut, using the permutation mean, and the std when the cell is filled.
def _permutation() -> tuple[str, list[dict]]:
    frame = _read_csv(PERMUTATION_IMPORTANCE_CSV, PERMUTATION_COLUMNS)
    models = frame["Model"].dropna().unique()
    if len(models) != 1:
        raise ValueError(
            f"{PERMUTATION_IMPORTANCE_CSV.name} should describe exactly one model; found {list(models)}"
        )
    top = frame.sort_values("Permutation_Importance_Mean", ascending=False).head(TOP_N)
    items = [
        _feature_item(
            r["Feature"],
            r["Permutation_Importance_Mean"],
            _optional_float(r["Permutation_Importance_Std"]),
        )
        for _, r in top.iterrows()
    ]
    return str(models[0]), items


# Group matrix rows by model. No file means the pipeline has not exported them yet.
def _confusion() -> dict[str, list[dict]]:
    if not CONFUSION_MATRICES_CSV.exists():
        return {}
    frame = _read_csv(CONFUSION_MATRICES_CSV, CONFUSION_COLUMNS)
    matrices: dict[str, list[dict]] = {}
    for _, row in frame.iterrows():
        matrices.setdefault(str(row["Model"]), []).append(
            {"actual": str(row["Actual"]), "predicted": str(row["Predicted"]), "count": int(row["Count"])}
        )
    return matrices


# Says why the CV winner was kept, and if another model scored higher on the test set.
def _selection_note(models: list[dict], selected: str) -> str:
    chosen = next(m for m in models if m["model"] == selected)
    note = (
        f"{selected} is selected because it has the highest mean training cross-validation "
        f"F1-macro ({chosen['cv_f1_macro_mean']:.4f})."
    )
    best_test = max(models, key=lambda m: m["f1_macro"])
    if best_test["model"] != selected:
        note += (
            f" {best_test['model']} scores higher on the held-out test set "
            f"(F1-macro {best_test['f1_macro']:.4f} vs {chosen['f1_macro']:.4f}), "
            "but test results are reported for comparison only and are not used for selection."
        )
    return note


# Public card: selected model, test size, and how many of those rows were correct.
def get_model_summary() -> dict:
    """Public, minimal summary: selected model and its held-out accuracy count."""
    results = get_ml_results()
    selected = next(m["model"] for m in results["models"] if m["selected"])
    cells = results["confusion_matrices"].get(selected, [])
    # Diagonal of the confusion matrix. None when that CSV was not exported.
    correct = sum(cell["count"] for cell in cells if cell["actual"] == cell["predicted"]) if cells else None
    n_test = results["n_test"]
    return {
        "selected_model": selected,
        "n_test": n_test,
        "correct": correct,
        "percentage": round(100 * correct / n_test, 1) if correct is not None and n_test else None,
    }


# Full staff payload, cached so every chart on the page shares one CSV read.
@lru_cache(maxsize=1)
def get_ml_results() -> dict:
    comparison = _read_csv(MODEL_COMPARISON_CSV, MODEL_COMPARISON_COLUMNS)
    models, selected, n_test = _models(comparison)

    feature_importance = dict(_importance(path) for path in (GB_IMPORTANCE_CSV, RF_IMPORTANCE_CSV))
    permutation_model, permutation_items = _permutation()
    confusion_matrices = _confusion()

    note = (
        f"Metrics come from the pipeline's saved outputs. Test metrics use a stratified "
        f"held-out set of {n_test} barangays. Feature and permutation importance show the "
        f"top {TOP_N} of the 11 thesis predictors."
    )
    if not confusion_matrices:
        note += " Confusion matrices are not exported by the pipeline yet."

    return {
        "models": models,
        "feature_importance": feature_importance,
        "permutation_importance": permutation_items,
        "permutation_importance_model": permutation_model,
        "confusion_matrices": confusion_matrices,
        "selection_note": _selection_note(models, selected),
        "n_test": n_test,
        "note": note,
    }
