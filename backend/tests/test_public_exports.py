from __future__ import annotations

import hashlib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import generated_files
from app.models.audit_log import AuditLog
from app.models.public_export import PublicExport
from app.services import barangay_data

BASE = "/api/admin/public-exports"
DISCLAIMER = "For information purposes only. Not a warning system."
COLUMNS = ["barangay", "district", "area", "hazard", "exposure", "vulnerability", "dpi_scaled", "priority_class"]


@pytest.fixture(autouse=True)
def generated_dir(tmp_path, monkeypatch) -> Path:
    monkeypatch.setattr(generated_files, "GENERATED_DIR", tmp_path / "generated")
    return tmp_path / "generated"


def _login(client: TestClient, username: str, password: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def admin_headers(client: TestClient, admin_account) -> dict[str, str]:
    return _login(client, "agos_admin", "AdminPass1234")


@pytest.fixture()
def staff_headers(client: TestClient, staff_account) -> dict[str, str]:
    return _login(client, "staff01", "StaffPass1234")


def _create(client: TestClient, headers: dict, kind: str = "csv", columns=None, **extra) -> dict:
    payload = {
        "kind": kind,
        "title": f"Barangay priority {kind}",
        "description": "Public summary",
        "columns": COLUMNS if columns is None else columns,
        "disclaimer": DISCLAIMER,
        **extra,
    }
    response = client.post(BASE, json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_admin_can_list_and_create(client: TestClient, admin_headers):
    created = _create(client, admin_headers)
    assert created["status"] == "draft"
    assert created["version"] == 1
    listed = client.get(BASE, headers=admin_headers).json()
    assert [item["id"] for item in listed] == [created["id"]]
    assert listed[0]["stale"] is False


def test_staff_gets_403_and_anonymous_401(client: TestClient, staff_headers):
    assert client.get(BASE, headers=staff_headers).status_code == 403
    assert client.post(BASE, json={}, headers=staff_headers).status_code == 403
    assert client.post(f"{BASE}/1/approve", headers=staff_headers).status_code == 403
    assert client.get(BASE).status_code == 401
    assert client.post(f"{BASE}/1/approve").status_code == 401


@pytest.mark.parametrize(
    "bad_column",
    ["ml_predicted_class", "ml_prediction_confidence", "agrees_with_dpi", "uploaded_by", "model_predicted_class"],
)
def test_columns_outside_whitelist_are_rejected(client: TestClient, admin_headers, bad_column):
    response = client.post(
        BASE,
        json={"kind": "csv", "title": "x", "columns": ["barangay", bad_column], "disclaimer": DISCLAIMER},
        headers=admin_headers,
    )
    assert response.status_code == 422
    assert bad_column in response.json()["detail"]


def test_whitelist_also_enforced_on_edit_and_disclaimer_required(client: TestClient, admin_headers):
    created = _create(client, admin_headers)
    response = client.patch(
        f"{BASE}/{created['id']}", json={"columns": ["barangay", "ml_predicted_class"]}, headers=admin_headers
    )
    assert response.status_code == 422
    missing = client.post(
        BASE, json={"kind": "csv", "title": "x", "columns": ["barangay"], "disclaimer": "  "}, headers=admin_headers
    )
    assert missing.status_code == 422


def test_patch_only_allowed_for_drafts(client: TestClient, admin_headers):
    created = _create(client, admin_headers)
    edited = client.patch(f"{BASE}/{created['id']}", json={"title": "Edited"}, headers=admin_headers)
    assert edited.status_code == 200 and edited.json()["title"] == "Edited"
    client.post(f"{BASE}/{created['id']}/approve", headers=admin_headers)
    again = client.patch(f"{BASE}/{created['id']}", json={"title": "Again"}, headers=admin_headers)
    assert again.status_code == 409


def test_csv_snapshot_has_disclaimer_whitelisted_header_and_checksum(
    client: TestClient, admin_headers, db_session: Session
):
    created = _create(client, admin_headers, columns=["barangay", "district", "dpi_scaled", "priority_class"])
    approved = client.post(f"{BASE}/{created['id']}/approve", headers=admin_headers).json()
    record = db_session.get(PublicExport, approved["id"])
    content = Path(record.file_path).read_bytes()
    assert hashlib.sha256(content).hexdigest() == approved["sha256"]
    lines = content.decode("utf-8-sig").splitlines()
    assert lines[0].startswith("# ")
    assert any(line == f"# Disclaimer: {DISCLAIMER}" for line in lines)
    header = next(line for line in lines if not line.startswith("#"))
    assert header == "Rank,Barangay,District,DPI_Scaled,Priority_Class"
    assert approved["row_count"] == len(barangay_data.get_all_barangays())


def test_report_snapshot_puts_disclaimer_before_rows(client: TestClient, admin_headers, db_session: Session):
    created = _create(client, admin_headers, kind="report")
    approved = client.post(f"{BASE}/{created['id']}/approve", headers=admin_headers).json()
    text = Path(db_session.get(PublicExport, approved["id"]).file_path).read_text("utf-8")
    assert text.index(DISCLAIMER) < text.index('<table class="t"')


def test_approve_supersedes_previous_of_same_kind(client: TestClient, admin_headers):
    first = _create(client, admin_headers)
    report = _create(client, admin_headers, kind="report")
    client.post(f"{BASE}/{first['id']}/approve", headers=admin_headers)
    client.post(f"{BASE}/{report['id']}/approve", headers=admin_headers)
    second = _create(client, admin_headers)
    assert second["version"] == 2
    client.post(f"{BASE}/{second['id']}/approve", headers=admin_headers)
    statuses = {item["id"]: item["status"] for item in client.get(BASE, headers=admin_headers).json()}
    assert statuses == {first["id"]: "superseded", report["id"]: "approved", second["id"]: "approved"}


def test_public_download_serves_only_the_approved_snapshot(client: TestClient, admin_headers, db_session: Session):
    assert client.get("/api/public/exports/csv/download").status_code == 404
    draft = _create(client, admin_headers)
    assert client.get("/api/public/exports/csv/download").status_code == 404
    assert client.get("/api/public/exports").json() == []

    approved = client.post(f"{BASE}/{draft['id']}/approve", headers=admin_headers).json()
    response = client.get("/api/public/exports/csv/download")
    assert response.status_code == 200
    assert hashlib.sha256(response.content).hexdigest() == approved["sha256"]
    assert "attachment" in response.headers["content-disposition"]

    meta = client.get("/api/public/exports").json()
    assert meta[0]["approved_at"].endswith(("Z", "+00:00"))
    assert meta == [
        {
            "kind": "csv",
            "title": approved["title"],
            "version": 1,
            "approved_at": meta[0]["approved_at"],
            "row_count": approved["row_count"],
            "disclaimer": DISCLAIMER,
        }
    ]

    newer = _create(client, admin_headers, title="Newer")
    assert hashlib.sha256(client.get("/api/public/exports/csv/download").content).hexdigest() == approved["sha256"]
    newer_approved = client.post(f"{BASE}/{newer['id']}/approve", headers=admin_headers).json()
    served = client.get("/api/public/exports/csv/download").content
    assert hashlib.sha256(served).hexdigest() == newer_approved["sha256"]


def test_unpublished_and_rejected_return_404(client: TestClient, admin_headers):
    first = _create(client, admin_headers)
    client.post(f"{BASE}/{first['id']}/approve", headers=admin_headers)
    no_reason = client.post(f"{BASE}/{first['id']}/unpublish", json={"reason": " "}, headers=admin_headers)
    assert no_reason.status_code == 422
    unpublished = client.post(
        f"{BASE}/{first['id']}/unpublish", json={"reason": "Data under review"}, headers=admin_headers
    )
    assert unpublished.json()["status"] == "unpublished"
    response = client.get("/api/public/exports/csv/download")
    assert response.status_code == 404
    assert "No approved public export" in response.json()["detail"]

    draft = _create(client, admin_headers)
    assert client.post(f"{BASE}/{draft['id']}/reject", json={}, headers=admin_headers).status_code == 422
    rejected = client.post(f"{BASE}/{draft['id']}/reject", json={"reason": "Wrong title"}, headers=admin_headers)
    assert rejected.json()["status"] == "rejected"
    assert client.get("/api/public/exports/csv/download").status_code == 404


def test_audit_entries_are_written(client: TestClient, admin_headers, db_session: Session):
    first = _create(client, admin_headers)
    client.patch(f"{BASE}/{first['id']}", json={"title": "Edited"}, headers=admin_headers)
    client.get(f"{BASE}/{first['id']}/preview", headers=admin_headers)
    client.post(f"{BASE}/{first['id']}/approve", headers=admin_headers)
    second = _create(client, admin_headers)
    client.post(f"{BASE}/{second['id']}/approve", headers=admin_headers)
    client.post(f"{BASE}/{second['id']}/unpublish", json={"reason": "Typo"}, headers=admin_headers)

    rows = db_session.query(AuditLog).filter(AuditLog.action.startswith("export_")).order_by(AuditLog.id).all()
    assert [(row.action, row.actor_username) for row in rows] == [
        ("export_created", "agos_admin"),
        ("export_edited", "agos_admin"),
        ("export_previewed", "agos_admin"),
        ("export_approved", "agos_admin"),
        ("export_created", "agos_admin"),
        ("export_superseded", "system"),
        ("export_approved", "agos_admin"),
        ("export_unpublished", "agos_admin"),
    ]
    history = client.get(f"{BASE}/{first['id']}/audit", headers=admin_headers).json()
    assert [entry["action"] for entry in history] == [
        "export_superseded",
        "export_approved",
        "export_previewed",
        "export_edited",
        "export_created",
    ]
    assert history[0]["details"] == "CSV v1 replaced by v2"
    assert history[0]["created_at"].endswith(("Z", "+00:00"))


def test_preview_downloads_the_draft_snapshot(client: TestClient, admin_headers, db_session: Session):
    draft = _create(client, admin_headers)
    response = client.get(f"{BASE}/{draft['id']}/preview", headers=admin_headers)
    assert response.status_code == 200
    assert hashlib.sha256(response.content).hexdigest() == draft["sha256"]
    assert Path(db_session.get(PublicExport, draft["id"]).file_path).name.endswith("-draft.csv")


def test_stale_flag_when_data_version_changes(client: TestClient, admin_headers, monkeypatch):
    draft = _create(client, admin_headers)
    client.post(f"{BASE}/{draft['id']}/approve", headers=admin_headers)
    assert client.get(BASE, headers=admin_headers).json()[0]["stale"] is False
    monkeypatch.setattr(barangay_data, "current_data_version", lambda: "changed-version")
    listed = client.get(BASE, headers=admin_headers).json()
    assert listed[0]["stale"] is True
    assert listed[0]["status"] == "approved"
    assert client.get("/api/public/exports/csv/download").status_code == 200
