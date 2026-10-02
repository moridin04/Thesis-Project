from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class ClassMetrics(BaseModel):
    precision: float
    recall: float
    f1: float
    support: int


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


class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    group: str
    importance: float
    std: Optional[float] = None


class ConfusionCell(BaseModel):
    actual: str
    predicted: str
    count: int


class MLResultsResponse(BaseModel):
    models: list[ModelResult]
    feature_importance: dict[str, list[FeatureImportanceItem]]
    permutation_importance: list[FeatureImportanceItem]
    permutation_importance_model: str
    confusion_matrices: dict[str, list[ConfusionCell]] = Field(default_factory=dict)
    selection_note: str
    n_test: int
    note: str
