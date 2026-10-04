from __future__ import annotations

import io
import re

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app import generated_files
from app.main import app
from app.models.audit_log import AuditLog
from app.reports import comprehensive_report
from app.reports.comprehensive_report import SECTION_TITLES, build_comprehensive_report

DOWNLOAD = "/api/staff/reports/comprehensive"
META = "/api/staff/reports/comprehensive/meta"
REGENERATE = "/api/admin/reports/comprehensive/regenerate"


@pytest.fixture(autouse=True)
def generated_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(generated_files, "GENERATED_DIR", tmp_path / "generated")


@pytest.fixture(scope="module")
def report_text() -> tuple[str, list[str]]:
    buffer = io.BytesIO()
    build_comprehensive_report(buffer)
    pages = [page.extract_text() for page in PdfReader(io.BytesIO(buffer.getvalue())).pages]
    return "\n".join(pages), pages


@pytest.fixture()
def build_calls(monkeypatch) -> list[int]:
    calls: list[int] = []
    original = comprehensive_report.build_comprehensive_report

    def counting(*args, **kwargs):
        calls.append(1)
        return original(*args, **kwargs)

    monkeypatch.setattr(comprehensive_report, "build_comprehensive_report", counting)
    return calls


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


def test_all_15_section_headings_in_order(report_text):
    text, _pages = report_text
    positions = [text.index(title) for title in SECTION_TITLES]
    assert len(SECTION_TITLES) == 15
    assert positions == sorted(positions)
    assert "Low, Medium, and High classes are relative tertiles within Manila." in text
    assert "should not replace official government hazard advisories" in text


def test_numbers_match_the_notebook_report(report_text):
    text, _pages = report_text
    flat = re.sub(r"\s+", " ", text)
    assert "Hazard 0.9877 0.0123 0.1929" in flat
    assert "Exposure 0.9521 0.0479 0.7495" in flat
    assert "Vulnerability 0.9963 0.0037 0.0576" in flat
    assert "High 299 Medium 299 Low 299" in flat
    assert re.search(r"Cross-Validation Performance .*? Gradient Boosting 0\.9343 ", flat)


def test_page_one_has_manila_time_and_data_version(report_text):
    _text, pages = report_text
    assert len(pages) == 32
    data_version = comprehensive_report.report_data_version()
    assert re.search(r"Generated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \(Asia/Manila\) \| Page 1", pages[0])
    assert f"Data version: {data_version}" in pages[0]
    assert "Data version" not in pages[1]


def test_role_guard(client: TestClient, staff_headers, admin_headers):
    assert client.get(META).status_code == 401
    assert client.get(DOWNLOAD).status_code == 401
    assert client.post(REGENERATE).status_code == 401
    assert client.get(META, headers=staff_headers).status_code == 200
    assert client.get(META, headers=admin_headers).status_code == 200
    assert client.post(REGENERATE, headers=staff_headers).status_code == 403
    assert client.post(REGENERATE, headers=admin_headers).status_code == 200


def test_staff_download_is_a_pdf(client: TestClient, staff_headers):
    response = client.get(DOWNLOAD, headers=staff_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert re.search(
        r'filename="Manila_Barangay_Flood_Risk_Comprehensive_Report_\d{4}-\d{2}-\d{2}\.pdf"',
        response.headers["content-disposition"],
    )


def test_meta_reports_empty_then_cached_file(client: TestClient, staff_headers):
    empty = client.get(META, headers=staff_headers).json()
    assert empty["available"] is False
    assert empty["data_version"] == comprehensive_report.report_data_version()

    pdf = client.get(DOWNLOAD, headers=staff_headers).content
    meta = client.get(META, headers=staff_headers).json()
    assert meta["available"] is True
    assert meta["page_count"] == 32
    assert meta["file_size"] == len(pdf)
    assert meta["generated_at"].endswith("+08:00")


def test_cache_is_reused_until_regenerated(client: TestClient, staff_headers, admin_headers, build_calls):
    first = client.get(DOWNLOAD, headers=staff_headers).content
    second = client.get(DOWNLOAD, headers=admin_headers).content
    assert first == second
    assert len(build_calls) == 1

    client.post(REGENERATE, headers=admin_headers)
    assert len(build_calls) == 2
    client.get(DOWNLOAD, headers=staff_headers)
    assert len(build_calls) == 2


def test_downloads_and_regenerations_are_audited(
    client: TestClient, staff_headers, admin_headers, db_session: Session
):
    assert client.get(DOWNLOAD).status_code == 401
    client.get(DOWNLOAD, headers=staff_headers)
    client.get(DOWNLOAD, headers=admin_headers)
    client.post(REGENERATE, headers=admin_headers)
    rows = db_session.query(AuditLog).filter(AuditLog.action.startswith("report_")).order_by(AuditLog.id).all()
    data_version = comprehensive_report.report_data_version()
    assert [(row.action, row.actor_username, row.details) for row in rows] == [
        ("report_downloaded", "staff01", f"Comprehensive report; data version {data_version}"),
        ("report_downloaded", "agos_admin", f"Comprehensive report; data version {data_version}"),
        ("report_regenerated", "agos_admin", f"Comprehensive report; data version {data_version}"),
    ]


def test_report_has_no_public_route_and_is_not_a_public_export(client: TestClient, admin_headers):
    public_paths = [route.path for route in app.routes if route.path.startswith("/api/public")]
    assert public_paths
    assert not [path for path in public_paths if "comprehensive" in path or "/reports" in path]
    assert client.get("/api/public/exports/comprehensive/download").status_code == 404
    created = client.post(
        "/api/admin/public-exports",
        json={"kind": "comprehensive", "title": "x", "columns": ["barangay"], "disclaimer": "Not a warning."},
        headers=admin_headers,
    )
    assert created.status_code == 422
