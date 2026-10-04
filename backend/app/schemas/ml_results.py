# JSON shapes for the model-results API.
# The numbers themselves are read from the saved training output in
# services/ml_results.py. This file only says which fields the
# response has, so the staff results page can rely on them.
# Nothing here recomputes scores or rankings.

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# Precision, recall, F1, and support for one class label.
class ClassMetrics(BaseModel):
    precision: float
    recall: float
    f1: float
    support: int


# Scores for one trained model. selected marks the one we kept.
class ModelResult(BaseModel):
    model: str
    selected: bool
    cv_f1_macro_mean: float
    cv_f1_macro_std: float
    best_params: dict[str, Any]
    accuracy: float
    balanced_accuracy: float
    f1_macro: float
    f1_weighted: float
    roc_auc_ovr_macro: Optional[float] = None
    per_class: dict[str, ClassMetrics]


# One feature's importance, with a display label and a group name.
class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    group: str
    importance: float
    std: Optional[float] = None


# One cell of a confusion matrix: actual label, predicted label, count.
class ConfusionCell(BaseModel):
    actual: str
    predicted: str
    count: int


# Full payload the results page asks for. n_test is the test-set size
# already stored with the output. confusion_matrices can be empty.
class MLResultsResponse(BaseModel):
    models: list[ModelResult]
    feature_importance: dict[str, list[FeatureImportanceItem]]
    permutation_importance: list[FeatureImportanceItem]
    permutation_importance_model: str
    confusion_matrices: dict[str, list[ConfusionCell]] = Field(default_factory=dict)
    selection_note: str
    n_test: int
    note: str
