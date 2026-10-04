from __future__ import annotations

import io
import re
from datetime import datetime
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import generated_files
from app.exports import class_guide
from app.exports.records import PUBLIC_EXPORT_COLUMNS
from app.models.public_export import PublicExport
from app.services import barangay_data

BASE = "/api/admin/public-exports"
DISCLAIMER = (
    "For information purposes only. Not a warning system. Priority classes are relative tertiles "
    "across Manila barangays, not official flood warnings."
)
COLUMNS = list(PUBLIC_EXPORT_COLUMNS)
CSV_COLUMNS = ["Rank", *PUBLIC_EXPORT_COLUMNS.values()]
SAMPLED = ["Barangay 310", "Barangay 628", "Barangay 649", "Barangay 20", "Barangay 188"]
ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(autouse=True)
def generated_dir(tmp_path, monkeypatch) -> Path:
    monkeypatch.setattr(generated_files, "GENERATED_DIR", tmp_path / "generated")
    return tmp_path / "generated"


@pytest.fixture()
def admin_headers(client: TestClient, admin_account) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"username": "agos_admin", "password": "AdminPass1234"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _snapshot(client: TestClient, headers: dict, db: Session, kind: str, approve: bool = False, columns=None) -> tuple[dict, bytes]:
    created = client.post(
        BASE,
        json={
            "kind": kind,
            "title": "Barangay Risk Summary",
            "columns": COLUMNS if columns is None else columns,
            "disclaimer": DISCLAIMER,
        },
        headers=headers,
    ).json()
    if approve:
        created = client.post(f"{BASE}/{created['id']}/approve", headers=headers).json()
    db.expire_all()
    return created, Path(db.get(PublicExport, created["id"]).file_path).read_bytes()


@pytest.fixture()
def csv_export(client: TestClient, admin_headers, db_session: Session) -> tuple[dict, bytes]:
    return _snapshot(client, admin_headers, db_session, "csv")


@pytest.fixture()
def html_export(client: TestClient, admin_headers, db_session: Session) -> tuple[dict, str]:
    created, content = _snapshot(client, admin_headers, db_session, "report")
    return created, content.decode("utf-8")


def test_csv_header_block_and_footer(csv_export):
    created, content = csv_export
    assert content.startswith(b"\xef\xbb\xbf")
    lines = content.decode("utf-8-sig").splitlines()
    header = lines[: lines.index(",".join(CSV_COLUMNS))]
    assert all(line.startswith("# ") for line in header)
    assert header[0] == "# AGOS Barangay Risk Summary"
    meta = next(line for line in header if line.startswith("# Version:"))
    assert f"Version: {created['version']}" in meta
    assert f"Data version: {barangay_data.current_data_version()}" in meta
    today = datetime.now(ZoneInfo("Asia/Manila")).strftime("%Y-%m-%d")
    assert re.search(rf"Generated: {today} \d\d:\d\d \(Asia/Manila\)", meta)
    assert "Records: 897" in meta
    assert any(class_guide.SOURCE_NOTE in line for line in header)
    assert f"# Disclaimer: {DISCLAIMER}" in header
    assert f"# {class_guide.TERTILE_NOTE}" in header
    assert any(line.startswith("# Rounding:") for line in header)
    assert any(line.startswith("# Columns:") and class_guide.DPI_NAME in line for line in header)
    assert "percent 0 to 100" in " ".join(header)
    assert "meters" in " ".join(header)
    assert lines[-1] == f"# Disclaimer: {DISCLAIMER}"


def test_csv_loads_as_897_rows_with_planning_and_context(csv_export):
    _created, content = csv_export
    frame = pd.read_csv(io.BytesIO(content), comment="#")
    assert frame.shape == (897, 15)
    assert list(frame.columns) == CSV_COLUMNS
    assert frame["Priority_Class"].value_counts().to_dict() == {"High": 299, "Medium": 299, "Low": 299}
    assert list(frame["Rank"]) == list(range(1, 898))
    assert frame["DPI_Scaled"].is_monotonic_decreasing
    assert int(frame["Population_2024"].sum()) == 1_902_590
    for label in class_guide.CLASS_ORDER:
        subset = frame.loc[frame["Priority_Class"] == label]
        assert set(subset["Planning_Reference"]) == {class_guide.planning_reference(label)}
        assert set(subset["DRRM_Pillar"]) == {class_guide.drrm_pillar(label)}


def test_csv_rounding_and_quoted_planning_text(csv_export):
    _created, content = csv_export
    text = content.decode("utf-8-sig")
    row = next(line for line in text.splitlines() if line.startswith("1,"))
    assert row.startswith("1,Barangay 310,District III,Santa Cruz,100.00,High,13761,43.28,98.96,2.00,0.6135,0.8478,0.4277,")
    assert "43.280626" not in text
    planning = class_guide.planning_reference("High")
    assert f'"{planning}"' in row
    frame = pd.read_csv(io.BytesIO(content), comment="#")
    first = frame.iloc[0]
    assert first["Barangay"] == "Barangay 310"
    assert float(first["DPI_Scaled"]) == 100.0
    assert int(first["Population_2024"]) == 13761
    assert f"{float(first['Flood_PCT_5yr']):.2f}" == "43.28"
    assert f"{float(first['Hazard']):.4f}" == "0.6135"


def test_district_and_area_match_the_shared_mapping(csv_export, html_export):
    _created, content = csv_export
    frame = pd.read_csv(io.BytesIO(content), comment="#").set_index("Barangay")
    _html_created, html = html_export
    for name in SAMPLED:
        record = barangay_data.get_barangay_by_id(name)
        assert (frame.loc[name, "District"], frame.loc[name, "Area"]) == (record["district"], record["area"])
        short = record["district"].removeprefix("District ")
        assert f"<td>{escape(name)}</td><td>{escape(short + ' · ' + record['area'])}</td>" in html
    assert (frame.loc["Barangay 310", "District"], frame.loc["Barangay 310", "Area"]) == ("District III", "Santa Cruz")


def test_html_has_disclaimer_versions_badges_and_population(html_export):
    created, html = html_export
    assert escape(DISCLAIMER) in html
    assert f"Version {created['version']}" in html
    assert barangay_data.current_data_version() in html
    assert "1,902,590" in html
    for label in class_guide.CLASS_ORDER:
        badge = {"High": "h", "Medium": "m", "Low": "l"}[label]
        assert f'<b class="{badge}">{label}</b>' in html
        assert html.count(escape(class_guide.planning_reference(label))) == 299
    assert html.count("<script") == 1
    assert 'id="hp"' in html
    assert html.count('<table class="t"') == 1
    assert html.count("<tr class=") == 897
    assert 'id="page-size"' in html
    assert 'value="25"' in html and 'value="50" selected' in html and 'value="100"' in html
    assert 'id="q"' in html
    assert 'id="class-filter"' in html and 'id="district-filter"' in html
    assert 'id="reset"' in html
    assert 'data-name="Barangay 310"' in html
    assert html.count('data-class="High"') == 299


def test_class_guide_text_lives_only_in_the_shared_module():
    sources = [
        (ROOT / "app/exports/html_report.py").read_text(),
        (ROOT / "app/exports/csv_export.py").read_text(),
        (ROOT / "app/exports/records.py").read_text(),
    ]
    for label in class_guide.CLASS_ORDER:
        text = class_guide.planning_reference(label)
        assert text in (ROOT / "app/exports/class_guide.py").read_text()
        assert all(text not in source for source in sources)


def test_html_is_self_contained_and_reports_size(html_export):
    _created, html = html_export
    size = len(html.encode("utf-8"))
    print(f"HTML size: {size} bytes")
    scripts = re.findall(r"<script\b([^>]*)>", html)
    assert len(scripts) == 1
    assert "src=" not in scripts[0]
    assert html.count("</script>") == 1
    assert not re.search(r"\son[A-Za-z]+\s*=", html)
    assert "eval(" not in html and "fetch(" not in html and "XMLHttpRequest" not in html
    assert "http://" not in html and "https://" not in html
    assert not re.search(r"""(src|href)\s*=\s*["']?(?!data:|#)[a-z]+:""", html)
    assert "<link" not in html and "@import" not in html
    assert size < 650_000
    assert "@page{size:A4 landscape;margin:12mm}" in html
    assert "print-color-adjust:exact" in html
    assert "tr[hidden]" in html
    assert 'class="pf"' in html
    assert "Hide planning columns" in html
    assert "No barangays match" in html


def test_whitelist_accepts_context_and_planning_and_rejects_staff_fields(client: TestClient, admin_headers):
    ok = client.post(
        BASE,
        json={"kind": "csv", "title": "x", "columns": COLUMNS, "disclaimer": DISCLAIMER},
        headers=admin_headers,
    )
    assert ok.status_code == 201
    auto = client.post(
        BASE,
        json={
            "kind": "csv",
            "title": "x",
            "columns": ["barangay", "dpi_scaled", "planning_reference"],
            "disclaimer": DISCLAIMER,
        },
        headers=admin_headers,
    )
    assert auto.status_code == 201
    assert "priority_class" in auto.json()["columns"]
    missing = client.post(
        BASE,
        json={"kind": "csv", "title": "x", "columns": ["district", "area"], "disclaimer": DISCLAIMER},
        headers=admin_headers,
    )
    assert missing.status_code == 422
    for bad in ("model_predicted_class", "confidence", "agreement", "ml_predicted_class", "unknown_field"):
        response = client.post(
            BASE,
            json={"kind": "csv", "title": "x", "columns": ["barangay", "dpi_scaled", "priority_class", bad], "disclaimer": DISCLAIMER},
            headers=admin_headers,
        )
        assert response.status_code == 422
        assert bad in response.json()["detail"]


def test_approved_snapshot_is_not_rewritten_by_later_versions(client: TestClient, admin_headers, db_session: Session):
    first, before = _snapshot(client, admin_headers, db_session, "csv", approve=True)
    _snapshot(client, admin_headers, db_session, "csv", approve=True)
    after = Path(db_session.get(PublicExport, first["id"]).file_path).read_bytes()
    assert after == before
