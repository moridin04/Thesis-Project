from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import generated_files
from app.main import app
from app.models.audit_log import AuditLog
from app.services import audit_service
from app.services.audit_service import record_audit_log

BASE = "/api/admin/public-exports"
AUDIT = "/api/admin/audit-logs"
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


def _create(client: TestClient, headers: dict, kind: str = "csv", title: str = "Barangay Risk Summary") -> dict:
    payload = {"kind": kind, "title": title, "columns": COLUMNS, "disclaimer": DISCLAIMER}
    response = client.post(BASE, json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _export_rows(db: Session, action: str | None = None) -> list[AuditLog]:
    db.expire_all()
    query = db.query(AuditLog).filter(AuditLog.action.startswith("export_"))
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.id).all()


def test_each_admin_action_writes_exactly_one_row(client: TestClient, admin_headers, db_session: Session):
    first = _create(client, admin_headers)
    assert [(r.action, r.actor_username, r.details) for r in _export_rows(db_session)] == [
        ("export_created", "agos_admin", "CSV v1 - Barangay Risk Summary"),
    ]

    full_form = {key: first[key] for key in ("title", "description", "columns", "disclaimer")}
    client.patch(f"{BASE}/{first['id']}", json={**full_form, "title": "Risk Summary"}, headers=admin_headers)
    client.get(f"{BASE}/{first['id']}/preview", headers=admin_headers)
    approved = client.post(f"{BASE}/{first['id']}/approve", headers=admin_headers).json()
    second = _create(client, admin_headers)
    client.post(f"{BASE}/{second['id']}/approve", headers=admin_headers)
    report = _create(client, admin_headers, kind="report")
    client.post(f"{BASE}/{report['id']}/reject", json={"reason": "Wrong title"}, headers=admin_headers)
    client.post(f"{BASE}/{second['id']}/unpublish", json={"reason": "Data under review"}, headers=admin_headers)

    rows = [(r.action, r.actor_username, r.resource_type, r.details) for r in _export_rows(db_session)]
    assert rows == [
        ("export_created", "agos_admin", "public_export", "CSV v1 - Barangay Risk Summary"),
        ("export_edited", "agos_admin", "public_export", "CSV v1 - Risk Summary; changed: title"),
        ("export_previewed", "agos_admin", "public_export", "CSV v1 - Risk Summary"),
        ("export_approved", "agos_admin", "public_export", f"CSV v1 - Risk Summary; sha256 {approved['sha256'][:12]}"),
        ("export_created", "agos_admin", "public_export", "CSV v2 - Barangay Risk Summary"),
        ("export_superseded", "system", "public_export", "CSV v1 replaced by v2"),
        ("export_approved", "agos_admin", "public_export", rows[6][3]),
        ("export_created", "agos_admin", "public_export", "HTML v1 - Barangay Risk Summary"),
        ("export_rejected", "agos_admin", "public_export", "HTML v1 - Barangay Risk Summary; reason: Wrong title"),
        ("export_unpublished", "agos_admin", "public_export", "CSV v2 - Barangay Risk Summary; reason: Data under review"),
    ]
    assert rows[6][3].startswith("CSV v2 - Barangay Risk Summary; sha256 ")


def test_public_download_is_anonymous_and_collapsed(client: TestClient, admin_headers, db_session: Session):
    csv_export = _create(client, admin_headers)
    client.post(f"{BASE}/{csv_export['id']}/approve", headers=admin_headers)
    report = _create(client, admin_headers, kind="report")
    client.post(f"{BASE}/{report['id']}/approve", headers=admin_headers)

    headers = {"User-Agent": "UniqueBrowser/9.9", "X-Forwarded-For": "203.0.113.7", "Cookie": "tracker=abc123"}
    assert client.get("/api/public/exports/csv/download", headers=headers).status_code == 200
    rows = _export_rows(db_session, "export_downloaded_public")
    assert [(r.actor_username, r.details) for r in rows] == [("public", "CSV v1")]

    for _ in range(13):
        client.get("/api/public/exports/csv/download", headers=headers)
    client.get("/api/public/exports/report/download", headers=headers)
    rows = _export_rows(db_session, "export_downloaded_public")
    assert [(r.actor_username, r.details) for r in rows] == [("public", "CSV v1 (x14)"), ("public", "HTML v1")]

    stored = " ".join(
        str(value) for r in db_session.query(AuditLog).all()
        for value in (r.actor_username, r.resource_type, r.resource_id, r.details)
    )
    for identifier in ("UniqueBrowser", "203.0.113.7", "tracker", "abc123", "testclient", "127.0.0.1"):
        assert identifier not in stored


def test_public_downloads_after_ten_minutes_start_a_new_row(client: TestClient, admin_headers, db_session: Session):
    created = _create(client, admin_headers)
    client.post(f"{BASE}/{created['id']}/approve", headers=admin_headers)
    client.get("/api/public/exports/csv/download")
    row = _export_rows(db_session, "export_downloaded_public")[0]
    row.created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=11)
    db_session.commit()
    client.get("/api/public/exports/csv/download")
    assert [r.details for r in _export_rows(db_session, "export_downloaded_public")] == ["CSV v1", "CSV v1"]


def test_staff_and_admin_events_are_never_collapsed(client: TestClient, admin_headers, db_session: Session):
    created = _create(client, admin_headers)
    for _ in range(3):
        client.get(f"{BASE}/{created['id']}/preview", headers=admin_headers)
    assert len(_export_rows(db_session, "export_previewed")) == 3


def test_failing_audit_write_does_not_block_downloads(
    client: TestClient, admin_headers, staff_headers, db_session: Session, monkeypatch
):
    created = _create(client, admin_headers)
    approved = client.post(f"{BASE}/{created['id']}/approve", headers=admin_headers).json()

    def broken(*_args, **_kwargs):
        raise RuntimeError("audit store unavailable")

    monkeypatch.setattr(audit_service, "add_audit_log", broken)
    public = client.get("/api/public/exports/csv/download")
    assert public.status_code == 200 and public.content.startswith(b"\xef\xbb\xbf# AGOS")
    preview = client.get(f"{BASE}/{approved['id']}/preview", headers=admin_headers)
    assert preview.status_code == 200
    report = client.get("/api/staff/reports/comprehensive", headers=staff_headers)
    assert report.status_code == 200 and report.content.startswith(b"%PDF")


def test_audit_log_endpoint_merges_events_newest_first_and_filters(
    client: TestClient, admin_headers, staff_headers, db_session: Session
):
    record_audit_log(db_session, action="upload_submitted", actor_username="staff01", details="hazard.csv")
    created = _create(client, admin_headers)
    client.post(f"{BASE}/{created['id']}/approve", headers=admin_headers)
    client.get("/api/staff/reports/comprehensive/meta", headers=staff_headers)
    client.get("/api/staff/reports/comprehensive", headers=staff_headers)

    entries = client.get(AUDIT, headers=admin_headers).json()
    actions = [entry["action"] for entry in entries]
    for expected in ("login_success", "upload_submitted", "export_created", "export_approved", "report_downloaded"):
        assert expected in actions
    keys = [(entry["created_at"], entry["id"]) for entry in entries]
    assert keys == sorted(keys, reverse=True)
    assert actions[0] == "report_downloaded"
    assert all(entry["created_at"].endswith("+00:00") for entry in entries)

    groups = {
        "exports": ("export_",),
        "reports": ("report_",),
        "uploads": ("upload_", "dataset_"),
        "accounts": ("account_", "login_"),
    }
    for group, prefixes in groups.items():
        filtered = client.get(AUDIT, params={"group": group}, headers=admin_headers).json()
        assert filtered, group
        assert all(entry["action"].startswith(prefixes) for entry in filtered), group
    assert client.get(AUDIT, params={"group": "other"}, headers=admin_headers).status_code == 422

    page = client.get(AUDIT, params={"limit": 2}, headers=admin_headers).json()
    next_page = client.get(AUDIT, params={"limit": 2, "offset": 2}, headers=admin_headers).json()
    assert [e["id"] for e in page + next_page] == [e["id"] for e in entries[:4]]

    today = datetime.now(audit_service.MANILA_TZ).date()
    assert len(client.get(AUDIT, params={"date": today.isoformat()}, headers=admin_headers).json()) == len(entries)
    other_day = (today - timedelta(days=3)).isoformat()
    assert client.get(AUDIT, params={"date": other_day}, headers=admin_headers).json() == []


def test_audit_rows_are_read_only_and_access_unchanged(client: TestClient, staff_headers):
    audit_routes = [route for route in app.routes if "audit" in getattr(route, "path", "")]
    assert audit_routes
    for route in audit_routes:
        assert route.methods <= {"GET", "HEAD"}, route.path
    assert client.get(AUDIT).status_code == 401
    assert client.get(AUDIT, headers=staff_headers).status_code == 403
