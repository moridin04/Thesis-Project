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
CSV_COLUMNS = ["Rank", "Barangay", "District", "Area", "Hazard", "Exposure", "Vulnerability", "DPI_Scaled", "Priority_Class"]
SAMPLED = ["Barangay 310", "Barangay 628", "Barangay 649", "Barangay 20", "Barangay 188"]


@pytest.fixture(autouse=True)
def generated_dir(tmp_path, monkeypatch) -> Path:
    monkeypatch.setattr(generated_files, "GENERATED_DIR", tmp_path / "generated")
    return tmp_path / "generated"


@pytest.fixture()
def admin_headers(client: TestClient, admin_account) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"username": "agos_admin", "password": "AdminPass1234"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _snapshot(client: TestClient, headers: dict, db: Session, kind: str, approve: bool = False) -> tuple[dict, bytes]:
    created = client.post(
        BASE,
        json={"kind": kind, "title": "Barangay Risk Summary", "columns": COLUMNS, "disclaimer": DISCLAIMER},
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
    assert f"# Disclaimer: {DISCLAIMER}" in header
    assert f"# {class_guide.TERTILE_NOTE}" in header
    guide = [line for line in header if line.startswith(("# High (", "# Medium (", "# Low ("))]
    assert [line.split(" (")[0] for line in guide] == ["# High", "# Medium", "# Low"]
    assert all(len(line) < 160 for line in guide)
    assert "# High (DPI 22.93 to 100.00)" in guide[0]
    assert any(line.startswith("# Rounding:") for line in header)
    assert any(line.startswith("# Columns:") and class_guide.DPI_NAME in line for line in header)
    assert lines[-1] == f"# Disclaimer: {DISCLAIMER}"


def test_csv_loads_as_897_rows_of_the_9_public_columns(csv_export):
    _created, content = csv_export
    frame = pd.read_csv(io.BytesIO(content), comment="#")
    assert frame.shape == (897, 9)
    assert list(frame.columns) == CSV_COLUMNS
    assert frame["Priority_Class"].value_counts().to_dict() == {"High": 299, "Medium": 299, "Low": 299}
    assert list(frame["Rank"]) == list(range(1, 898))
    assert frame["DPI_Scaled"].is_monotonic_decreasing
    text = content.decode("utf-8-sig")
    for forbidden in ("Planning_Reference", "DRRM_Pillar", "Population", "Elevation", "Flood_PCT", "ML_"):
        assert forbidden not in text


def test_csv_rounding(csv_export):
    _created, content = csv_export
    first = content.decode("utf-8-sig").splitlines()
    row = next(line for line in first if line.startswith("1,"))
    assert row == "1,Barangay 310,District III,Santa Cruz,0.6135,0.8478,0.4277,100.00,High"


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


def test_html_has_disclaimer_versions_badges_and_guide_once(html_export):
    created, html = html_export
    assert escape(DISCLAIMER) in html
    assert f"Version {created['version']}" in html
    assert barangay_data.current_data_version() in html
    for label in class_guide.CLASS_ORDER:
        badge = {"High": "h", "Medium": "m", "Low": "l"}[label]
        assert f'<b class="{badge}">{label}</b>' in html
        for action in class_guide.CLASS_GUIDE[label]["actions"]:
            assert html.count(escape(action)) == 1, action
    for pillar in class_guide.PILLAR_SHORT:
        expected = sum(pillar in class_guide.CLASS_GUIDE[label]["pillars"] for label in class_guide.CLASS_ORDER)
        assert html.count(f"<li>{escape(pillar)}</li>") == expected
    assert html.count('id="s-guide"') == 1
    assert html.count("<details>") == 6


def test_html_rows_never_carry_planning_text(html_export):
    _created, html = html_export
    planning = {record["planning_reference"] for record in barangay_data.get_all_barangays()}
    pillars = {record["drrm_pillar"] for record in barangay_data.get_all_barangays()}
    tables = re.findall(r'<table class="t">.*?</table>', html, flags=re.S)
    rows = [row for table in tables for row in re.findall(r"<tr>.*?</tr>", table, flags=re.S)]
    assert len(rows) > 897
    for row in rows:
        assert not any(text in row for text in planning | pillars)
        assert "Disaster" not in row and "planning" not in row.lower()
    assert "Planning_Reference" not in html and "DRRM_Pillar" not in html


def test_html_is_self_contained_and_small(html_export):
    _created, html = html_export
    assert "http://" not in html and "https://" not in html
    assert not re.search(r"""(src|href)\s*=\s*["']?(?!data:|#)[a-z]+:""", html)
    assert "<link" not in html and "@import" not in html
    assert len(html.encode("utf-8")) < 300_000
    assert "@page{size:A4;margin:15mm}" in html
    assert "print-color-adjust:exact" in html
    assert 'class="pf"' in html


def test_approved_snapshot_is_not_rewritten_by_later_versions(client: TestClient, admin_headers, db_session: Session):
    first, before = _snapshot(client, admin_headers, db_session, "csv", approve=True)
    _snapshot(client, admin_headers, db_session, "csv", approve=True)
    after = Path(db_session.get(PublicExport, first["id"]).file_path).read_bytes()
    assert after == before
