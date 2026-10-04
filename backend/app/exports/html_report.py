# Single-file HTML report for a public export.
# public_exports.py calls render_report with the same ranked rows as the CSV.
# The logo, CSS, and pager script are inlined so the file opens on its own.
# Class ranges and pillar labels come from class_guide. We do not score DPI here.
# On screen the pager starts at 50 rows. Print CSS shows every row.

"""Self-contained public HTML report: inline CSS, embedded logo, one inline pager script."""

from __future__ import annotations

import base64
import re
from datetime import datetime
from functools import lru_cache
from html import escape
from pathlib import Path

from app.exports import class_guide
from app.exports.records import district_short, place_label

# Small label above the admin title in the header band.
REPORT_TITLE = "AGOS Barangay Risk Report"
# PNG shipped next to this module. It is embedded so the page needs no extra file.
LOGO_PATH = Path(__file__).resolve().parent / "assets" / "agos-logo-white.png"
# Frontend pager module. Its export keywords are stripped before we inline it.
PAGER_LOGIC = Path(__file__).resolve().parents[3] / "frontend" / "src" / "utils" / "exportReportPager.js"
# Boot file that connects those pager functions to the filters and the table.
PAGER_BOOT = Path(__file__).resolve().parent / "report_pager_boot.js"

# CSS class letter for each priority badge. Any other label uses the Low style.
_BADGE = {"High": "h", "Medium": "m", "Low": "l"}
# Pixel widths. Their sum is also the table min-width, so columns keep these sizes.
_COL_WIDTHS = {
    "rank": "52px",
    "barangay": "110px",
    "place": "140px",
    "dpi_scaled": "64px",
    "priority_class": "80px",
    "population_2024": "96px",
    "flood_pct_5yr": "76px",
    "flood_pct_25yr": "84px",
    "elevation_mean": "76px",
    "hazard": "68px",
    "exposure": "76px",
    "vulnerability": "88px",
    "planning_reference": "260px",
    "drrm_pillar": "200px",
}

# Styles for the whole file. Controls stay hidden until the boot script adds class js.
# Print rules use landscape A4 and show rows the on-screen pager had hidden.
_CSS = """
:root{--teal:#024950;--ink:#003135;--body:#3d6265;--line:#d7e6e8;--tint:#e9f5f7;--sec:#0fa4af;
--h:#964734;--h-bg:#f3e3df;--h-tx:#7a3426;--m:#b8893d;--m-bg:#f7ecd6;--m-tx:#6b4c12;--l:#024950;--l-bg:#d9eef1;--l-tx:#024950}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#f4f9fa;color:var(--ink);font:15px/1.35 "Plus Jakarta Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
h1,h2,h3{font-family:"Fraunces",Georgia,"Times New Roman",serif;line-height:1.2;margin:0}
.pg,.pg>tbody,.pg>tbody>tr,.pg>tbody>tr>td{display:block}
.pg>tfoot,.pf{display:none}
.wrap{max-width:1280px;margin:0 auto;padding:0 20px}
.band{background:var(--teal);color:#fff;padding:28px 0 24px}
.band .wrap{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center}
.band img{display:block;width:140px;height:auto}
.band .tt{flex:1 1 320px;min-width:0}
.eb{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cfeef2}
.band h1{font-size:28px}
.band .ds{margin:6px 0 0;color:#e3f4f6}
.chips{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;width:100%}
.chips li{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;max-width:100%;overflow-wrap:anywhere}
.chips span{font-weight:400;color:#d6f0f3;margin-right:4px}
main{padding:24px 0 8px}
section{margin:0 0 32px}
h2{font-size:22px;margin-bottom:12px}
.note{background:#fff;border:1px solid var(--line);border-left:5px solid var(--h);border-radius:12px;padding:14px 18px;margin:0 0 28px}
.note strong{display:block;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--h-tx)}
.note p{margin:4px 0 0}
.lead{margin:-4px 0 14px;color:var(--body)}
.cards{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.card{background:#fff;border:1px solid var(--line);border-top:5px solid var(--c);border-radius:14px;padding:16px 18px}
.c-h{--c:var(--h)}.c-m{--c:var(--m)}.c-l{--c:var(--l)}
.card h3{font-size:17px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.card .n{font:600 34px/1.1 "Fraunces",Georgia,serif;margin:10px 0 2px}
.card p{margin:0;color:var(--body)}
b.h,b.m,b.l{display:inline-block;border-radius:999px;padding:1px 10px;font:700 12px/1.5 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;border:1px solid}
b.h{background:var(--h-bg);color:var(--h-tx);border-color:var(--h)}
b.m{background:var(--m-bg);color:var(--m-tx);border-color:var(--m)}
b.l{background:var(--l-bg);color:var(--l-tx);border-color:var(--l)}
.controls,.pager{display:none}
html.js .controls{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:end;margin:0 0 12px}
html.js .pager{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:0 0 12px}
html.js .pager.below{margin:12px 0 0}
.controls label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--teal)}
.controls select,.controls input[type=search]{min-height:40px;border:1px solid var(--line);border-radius:10px;padding:6px 10px;font:15px/1.35 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;background:#fff;color:var(--ink)}
.controls .check{flex-direction:row;align-items:center;gap:8px;min-height:40px}
.controls button,.pager-nav button{min-height:40px;border:1px solid var(--line);border-radius:10px;padding:6px 12px;background:#fff;color:var(--teal);font:600 13px/1.35 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.controls button:focus-visible,.pager-nav button:focus-visible,.controls select:focus-visible,.controls input:focus-visible{
outline:2px solid var(--sec);outline-offset:2px}
.pager-nav{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.pager-nav button[aria-current=page]{background:var(--teal);color:#fff;border-color:var(--teal)}
.pager-nav button:disabled{opacity:.45;cursor:not-allowed}
.pager-nav .gap{padding:0 4px;color:var(--body)}
.pager-status{font-size:13px;color:var(--body)}
section:has(#hp:checked) .plan{display:none}
.scroll{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:14px}
.t{border-collapse:collapse;table-layout:fixed;font-size:13px;line-height:1.35}
.t caption{text-align:left;padding:10px 14px 6px;font-weight:600;color:var(--body)}
.t th,.t td{padding:8px 10px;text-align:left;border-top:1px solid var(--line);vertical-align:middle;white-space:nowrap;line-height:1.35}
.t thead th{position:sticky;top:0;z-index:1;background:var(--tint);font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--teal)}
.t tbody tr:nth-child(even) td{background:#f7fbfc}
.t tbody tr:hover td{background:#eef7f8}
.t .n,.t td:first-child{text-align:right;font-variant-numeric:tabular-nums}
.t td:first-child{color:var(--body)}
.t td.plan,.t th.plan{white-space:normal;overflow-wrap:break-word;word-break:normal;hyphens:manual;vertical-align:top}
.t td.pr,.t th.pr{width:260px;font-size:12px;line-height:1.35;color:var(--body)}
.t td.dr,.t th.dr{width:200px;padding-right:16px}
.pl{display:flex;flex-wrap:wrap;gap:3px;align-items:flex-start}
.pl i{display:inline-block;background:var(--tint);border:1px solid var(--line);border-radius:999px;padding:1px 7px;font:600 10px/1.3 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;font-style:normal;white-space:nowrap}
#empty-row td{text-align:center;white-space:normal;color:var(--body);padding:18px 10px}
.foot{border-top:1px solid var(--line);padding:16px 0 28px;color:var(--body);font-size:13px}
.foot p{margin:2px 0}
@media (max-width:600px){
body{font-size:14px}.band h1{font-size:22px}.band img{width:112px}
html.js .controls{flex-direction:column;align-items:stretch}
}
@page{size:A4 landscape;margin:12mm}
@media print{
*{ -webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#fff;font-size:9pt}
.pg{display:table;width:100%;border-collapse:collapse}
.pg>tbody{display:table-row-group}.pg>tbody>tr{display:table-row}.pg>tbody>tr>td{display:table-cell;padding:0}
.pg>tfoot{display:table-footer-group}
.fsp{height:10mm}
.pf{display:block;position:fixed;left:0;right:0;bottom:0;font-size:7.5pt;line-height:1.35;color:var(--body);border-top:1px solid var(--line);padding-top:2mm;background:#fff}
.wrap{max-width:none;padding:0}
.band{padding:12px 14px;border-radius:10px}
.card,.note,.t tr{break-inside:avoid;page-break-inside:avoid}
h2,.lead{break-after:avoid;page-break-after:avoid}
.t{width:100%;min-width:0;font-size:7.5pt}
.t thead{display:table-header-group}
.t th,.t td{padding:4px 5px}
.scroll{overflow:visible;border-radius:0}
.t tbody tr[hidden]:not(#empty-row){display:table-row !important}
#empty-row{display:none !important}
html.js .pager,html.js .controls,.pager,.controls{display:none !important}
section:has(#hp:checked) .plan,.t td.plan,.t th.plan{display:table-cell !important;white-space:normal;font-size:6.5pt}
.t td.pr,.t th.pr{width:32mm}
.t td.dr,.t th.dr{width:28mm}
}
"""


# Read the logo once and cache the data URI the img tag uses.
@lru_cache(maxsize=1)
def _logo_data_uri() -> str:
    return "data:image/png;base64," + base64.b64encode(LOGO_PATH.read_bytes()).decode("ascii")


# Script-tag body: the frontend pager, then the local boot file.
def _pager_script() -> str:
    # Strip a leading export so const and function run in a plain script tag.
    logic = re.sub(r"^export ", "", PAGER_LOGIC.read_text(encoding="utf-8"), flags=re.M)
    boot = PAGER_BOOT.read_text(encoding="utf-8")
    return logic + "\n" + boot


# Clock text for the header and footer. The day number is not zero-padded.
def _generated_text(moment: datetime) -> str:
    return f"{moment:%b} {moment.day}, {moment:%Y %H:%M} (Asia/Manila)"


# Chosen columns in display order. District and area share one place column.
def _table_columns(columns: list[str]) -> list[tuple[str, str, str]]:
    """(key, header, extra class)."""
    selected = set(columns)
    spec: list[tuple[str, str, str]] = [("rank", "Rank", "")]
    if "barangay" in selected:
        spec.append(("barangay", "Barangay", ""))
    if "district" in selected or "area" in selected:
        # The place heading depends on whether district, area, or both were selected.
        header = {(True, True): "District and Area", (True, False): "District", (False, True): "Area"}[
            ("district" in selected, "area" in selected)
        ]
        spec.append(("place", header, ""))
    mapping = (
        ("dpi_scaled", "DPI"),
        ("priority_class", "Priority"),
        ("population_2024", "Population 2024"),
        ("flood_pct_5yr", "Flood 5yr %"),
        ("flood_pct_25yr", "Flood 25yr %"),
        ("elevation_mean", "Elevation m"),
        ("hazard", "Hazard"),
        ("exposure", "Exposure"),
        ("vulnerability", "Vulnerability"),
        ("planning_reference", "Planning"),
        ("drrm_pillar", "DRRM pillars"),
    )
    numeric = {
        "dpi_scaled",
        "population_2024",
        "flood_pct_5yr",
        "flood_pct_25yr",
        "elevation_mean",
        "hazard",
        "exposure",
        "vulnerability",
    }
    for key, label in mapping:
        if key not in selected:
            continue
        extra = "n" if key in numeric else ""
        if key == "planning_reference":
            extra = "plan pr"
        elif key == "drrm_pillar":
            extra = "plan dr"
        spec.append((key, label, extra))
    return spec


# Blank when the value is missing, otherwise a fixed number of decimals.
def _num(value, decimals: int) -> str:
    return "" if value is None else f"{float(value):.{decimals}f}"


# One HTML cell. DRRM pills come from the class guide for that priority class.
def _cell(key: str, row: dict, columns: set[str], extra: str) -> str:
    cls = f' class="{extra}"' if extra else ""
    if key == "place":
        if "district" in columns and "area" in columns:
            text = place_label(row)
        elif "district" in columns:
            text = district_short(row.get("district"))
        else:
            text = row.get("area") or ""
        return f"<td{cls}>{escape(text)}</td>"
    if key == "priority_class":
        label = row[key]
        return f'<td{cls}><b class="{_BADGE.get(label, "l")}">{escape(label)}</b></td>'
    if key == "population_2024":
        value = "" if row[key] is None else f"{int(round(float(row[key]))):,}"
        return f"<td{cls}>{value}</td>"
    if key in ("dpi_scaled", "flood_pct_5yr", "flood_pct_25yr", "elevation_mean"):
        return f"<td{cls}>{_num(row[key], 2)}</td>"
    if key in ("hazard", "exposure", "vulnerability"):
        return f"<td{cls}>{_num(row[key], 4)}</td>"
    if key == "planning_reference":
        return f"<td{cls}>{escape(row[key])}</td>"
    if key == "drrm_pillar":
        pills = "".join(
            f"<i>{escape(class_guide.PILLAR_SHORT.get(p, p))}</i>"
            for p in class_guide.CLASS_GUIDE[row["priority_class"]]["pillars"]
        )
        return f'<td class="plan dr"><span class="pl">{pills}</span></td>'
    return f"<td{cls}>{escape(str(row[key]))}</td>"


# Column width tags, plus the pixel total the table style needs.
def _colgroup(spec: list[tuple[str, str, str]]) -> tuple[str, int]:
    cols = []
    total = 0
    for key, _label, _extra in spec:
        width = _COL_WIDTHS.get(key, "72px")
        total += int(width.replace("px", ""))
        cols.append(f'<col style="width:{width}">')
    return f'<colgroup>{"".join(cols)}</colgroup>', total


# Status line the boot script replaces. The 50 matches the default page size.
def _pager_bar(position: str, count: int) -> str:
    return (
        f'<div class="pager {position}">'
        f'<p class="pager-status" aria-live="polite">Showing 1 to {min(50, count)} of {count} barangays</p>'
        f'<nav class="pager-nav" aria-label="Table pagination, {position}"></nav>'
        "</div>"
    )


# Filter controls. The element ids are the ones report_pager_boot.js looks up.
def _controls(has_planning: bool) -> str:
    classes = "".join(f'<option value="{label}">{label}</option>' for label in class_guide.CLASS_ORDER)
    # Manila districts I through VI, the same labels the pager script accepts.
    districts = "".join(f'<option value="{item}">{item}</option>' for item in ("I", "II", "III", "IV", "V", "VI"))
    hide = ""
    if has_planning:
        hide = (
            '<label class="check" for="hp"><input type="checkbox" id="hp"> Hide planning columns</label>'
        )
    return f"""<div class="controls">
<label for="page-size">Page size
<select id="page-size">
<option value="25">25</option>
<option value="50" selected>50</option>
<option value="100">100</option>
</select>
</label>
<label for="q">Search
<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="Barangay name or number">
</label>
<label for="class-filter">Priority class
<select id="class-filter">
<option value="">All</option>
{classes}
</select>
</label>
<label for="district-filter">District
<select id="district-filter">
<option value="">All</option>
{districts}
</select>
</label>
<button type="button" id="reset">Reset</button>
{hide}
</div>"""


# The barangay table. data-name, data-class, and data-district feed the pager.
def _table(caption: str, spec: list[tuple[str, str, str]], rows: list[dict], columns: set[str]) -> str:
    head_cells = []
    for _key, label, extra in spec:
        attr = f' class="{extra}"' if extra else ""
        head_cells.append(f'<th scope="col"{attr}>{escape(label)}</th>')
    colgroup, width = _colgroup(spec)
    body = []
    for row in rows:
        badge = _BADGE.get(row["priority_class"], "l")
        cells = "".join(_cell(key, row, columns, extra) for key, _label, extra in spec)
        name = escape(row["barangay"], quote=True)
        klass = escape(row["priority_class"], quote=True)
        district = escape(district_short(row.get("district")), quote=True)
        body.append(
            f'<tr class="{badge}" data-name="{name}" data-class="{klass}" data-district="{district}">{cells}</tr>'
        )
    empty = f'<tr id="empty-row" hidden><td colspan="{len(spec)}">No barangays match</td></tr>'
    return (
        f'<div class="scroll"><table class="t" id="barangay-table" style="width:{width}px;min-width:{width}px">'
        f"<caption>{escape(caption)}</caption>{colgroup}"
        f"<thead><tr>{''.join(head_cells)}</tr></thead><tbody>{''.join(body)}{empty}</tbody></table></div>"
    )


# 2024 population as a whole number. A missing value counts as zero on the cards.
def _population(row: dict) -> int:
    value = row.get("population_2024")
    return 0 if value is None else int(round(float(value)))


# One card per class: barangay count, DPI range in these rows, and population.
def _summary_cards(rows: list[dict], ranges: dict) -> str:
    counts = {label: 0 for label in class_guide.CLASS_ORDER}
    people = {label: 0 for label in class_guide.CLASS_ORDER}
    for row in rows:
        label = row["priority_class"]
        counts[label] = counts.get(label, 0) + 1
        people[label] = people.get(label, 0) + _population(row)
    total = sum(people.values())
    cards = "".join(
        f'<article class="card c-{_BADGE[label]}"><h3><b class="{_BADGE[label]}">{label}</b> priority</h3>'
        f'<p class="n">{counts[label]}</p>'
        f'<p>barangays &middot; {class_guide.range_text(ranges.get(label))}<br>'
        f'Population (2024) represented: {people[label]:,}</p></article>'
        for label in class_guide.CLASS_ORDER
    )
    return (
        '<section aria-labelledby="s-sum"><h2 id="s-sum">Priority classes at a glance</h2>'
        f'<p class="lead">Population (2024) represented: {total:,}.</p>'
        f'<div class="cards">{cards}</div></section>'
    )


# Assemble the document from the ranked rows and return UTF-8 bytes.
def render_report(
    *,
    title: str,
    description: str | None,
    version: int,
    data_version: str,
    generated_at: datetime,
    disclaimer: str,
    columns: list[str],
    rows: list[dict],
) -> bytes:
    # Min and max scaled DPI inside each class, for the summary cards.
    ranges = class_guide.class_ranges(rows)
    spec = _table_columns(columns)
    selected = set(columns)
    disclaimer_html = escape(disclaimer.strip()).replace("\n", "<br>")
    meta_line = f"Version {version} &middot; Data version {escape(data_version)}"
    description_html = f'<p class="ds">{escape(description)}</p>' if description else ""
    chips = "".join(
        f"<li><span>{name}</span>{escape(str(value))}</li>"
        for name, value in (
            ("Version", version),
            ("Data version", data_version),
            ("Generated", _generated_text(generated_at)),
            ("Records", len(rows)),
        )
    )
    # The hide-planning checkbox is added only when one of those columns is present.
    has_planning = "planning_reference" in selected or "drrm_pillar" in selected
    document = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} &middot; Version {version}</title>
<style>{_CSS}</style>
</head>
<body>
<table class="pg" role="presentation"><tbody><tr><td>
<header class="band"><div class="wrap">
<img src="{_logo_data_uri()}" alt="AGOS Manila" width="140" height="41">
<div class="tt"><p class="eb">{REPORT_TITLE}</p><h1>{escape(title)}</h1>{description_html}</div>
<ul class="chips" aria-label="Report details">{chips}</ul>
</div></header>
<main class="wrap">
<aside class="note" role="note" aria-label="Disclaimer"><strong>Disclaimer</strong><p>{disclaimer_html}</p></aside>
{_summary_cards(rows, ranges)}
<section aria-labelledby="s-all">
<h2 id="s-all">All barangays by priority</h2>
<p class="lead">{escape(class_guide.TERTILE_NOTE)} DPI is the {class_guide.DPI_NAME}, scaled 0 to 100. Source: {escape(class_guide.SOURCE_NOTE)}.</p>
{_controls(has_planning)}
{_pager_bar("top", len(rows))}
{_table(f"All {len(rows)} Manila barangays by DPI, highest first", spec, rows, selected)}
{_pager_bar("below", len(rows))}
</section>
</main>
<footer class="foot"><div class="wrap">
<p><strong>{REPORT_TITLE}</strong> &middot; {meta_line} &middot; Generated {escape(_generated_text(generated_at))}</p>
<p>DPI, flood percent and elevation shown to 2 decimals; Hazard, Exposure and Vulnerability to 4 decimals. Stored data is unchanged.</p>
<p><strong>Disclaimer:</strong> {disclaimer_html}</p>
</div></footer>
</td></tr></tbody><tfoot><tr><td><div class="fsp"></div></td></tr></tfoot></table>
<div class="pf" aria-hidden="true">{REPORT_TITLE} &middot; {meta_line} &middot; {disclaimer_html}</div>
<script>{_pager_script()}</script>
</body>
</html>
"""
    return document.encode("utf-8")
