# Model comparison for staff and admin, plus the small public card.
# Covers app.services.ml_results, which reads the saved pipeline CSVs.
# The selected model is the one with the highest mean CV F1.
# A missing confusion file stays empty. The public card leaves out
# the full metric tables.

from __future__ import annotations

from collections import Counter

import pytest
from fastapi.testclient import TestClient

from app.services import ml_results
from app.services.ml_results import FEATURE_META, TOP_N, get_ml_results
from tests.conftest import admin_account, client, staff_account


@pytest.fixture()
def results() -> dict:
    get_ml_results.cache_clear()
    yield get_ml_results()
    get_ml_results.cache_clear()


# The comparison file produces three model rows.
def test_three_models_compared(results: dict):
    assert len(results["models"]) == 3


# Gradient Boosting is the selected model, the highest mean CV F1.
def test_selected_model_is_highest_cv_f1(results: dict):
    selected = [m["model"] for m in results["models"] if m["selected"]]
    assert selected == ["Gradient Boosting"]


# The held-out set size reported by the service is 180.
def test_n_test_is_180(results: dict):
    assert results["n_test"] == 180


# Each model has a per-class block for Low, Medium, and High.
def test_every_model_has_per_class_metrics(results: dict):
    for model in results["models"]:
        assert set(model["per_class"]) == {"Low", "Medium", "High"}


# The 11 thesis predictors are grouped as 4 hazard, 4 exposure,
# and 3 vulnerability.
def test_feature_meta_has_11_grouped_predictors():
    assert len(FEATURE_META) == 11
    assert Counter(meta["group"] for meta in FEATURE_META.values()) == {
        "Hazard": 4,
        "Exposure": 4,
        "Vulnerability": 3,
    }
    assert FEATURE_META["Flood_PCT_5yr"]["label"] == "Flood coverage (5-yr, %)"
    assert FEATURE_META["Flood_PCT_25yr"]["label"] == "Flood coverage (25-yr, %)"


# Importance lists name only those predictors and stop at TOP_N.
def test_importance_features_known_and_capped(results: dict):
    lists = list(results["feature_importance"].values()) + [results["permutation_importance"]]
    assert lists
    for items in lists:
        assert 0 < len(items) <= TOP_N
        for item in items:
            assert item["feature"] in FEATURE_META
            assert item["label"] == FEATURE_META[item["feature"]]["label"]
            assert item["group"] == FEATURE_META[item["feature"]]["group"]


# A missing confusion-matrix file becomes an empty dict so the page can load.
def test_confusion_matrices_default_to_empty(monkeypatch, tmp_path):
    monkeypatch.setattr(ml_results, "CONFUSION_MATRICES_CSV", tmp_path / "missing.csv")
    assert ml_results._confusion() == {}


# A comparison CSV without CV_F1_Macro_Mean is refused. Selection needs it.
def test_missing_required_column_raises(tmp_path):
    path = tmp_path / "model_comparison_results.csv"
    path.write_text("Model,Accuracy\nGradient Boosting,0.9\n", encoding="utf-8")
    with pytest.raises(ValueError, match="CV_F1_Macro_Mean"):
        ml_results._read_csv(path, ml_results.MODEL_COMPARISON_COLUMNS)


def _token(client: TestClient, username: str, password: str) -> str:
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


# /api/ml/results with no token returns 401.
def test_ml_results_requires_authentication(client: TestClient):
    assert client.get("/api/ml/results").status_code == 401


# An admin token receives the three-model payload.
def test_ml_results_for_admin(client: TestClient, admin_account):
    token = _token(client, "agos_admin", "AdminPass1234")
    response = client.get("/api/ml/results", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()["models"]) == 3


# A staff token receives the same payload, including the Gradient Boosting
# counts for rows whose actual class is High.
def test_ml_results_for_staff(client: TestClient, staff_account):
    get_ml_results.cache_clear()
    token = _token(client, "staff01", "StaffPass1234")
    response = client.get("/api/ml/results", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert [m["model"] for m in body["models"] if m["selected"]] == ["Gradient Boosting"]
    assert body["n_test"] == 180

    matrices = body["confusion_matrices"]
    assert set(matrices) == {m["model"] for m in body["models"]}
    for cells in matrices.values():
        assert len(cells) == 9
    gb_high = {
        cell["predicted"]: cell["count"]
        for cell in matrices["Gradient Boosting"]
        if cell["actual"] == "High"
    }
    assert gb_high == {"High": 56, "Low": 0, "Medium": 4}


# The public card is the selected model, test size, correct count,
# and percentage. The metric tables stay on the staff route.
def test_public_model_summary_is_minimal(client: TestClient):
    response = client.get("/api/public/model-summary")
    assert response.status_code == 200
    assert response.json() == {
        "selected_model": "Gradient Boosting",
        "n_test": 180,
        "correct": 165,
        "percentage": 91.7,
    }
