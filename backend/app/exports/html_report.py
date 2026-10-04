"""Self-contained public HTML report: inline CSS, embedded logo, no external requests."""

from __future__ import annotations

import base64
from datetime import datetime
from functools import lru_cache
from html import escape
from pathlib import Path

from app.exports import class_guide
from app.exports.records import district_short

REPORT_TITLE = "AGOS Barangay Risk Report"
LOGO_PATH = Path(__file__).resolve().parent / "assets" / "agos-logo-white.png"
DISTRICT_PREVIEW_ROWS = 10
TOP_ROWS = 10

_BADGE = {"High": "h", "Medium": "m", "Low": "l"}
_ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}

_CSS = """
:root{--teal:#024950;--ink:#003135;--body:#3d6265;--line:#d7e6e8;--tint:#e9f5f7;--sec:#0fa4af;
--h:#964734;--h-bg:#f3e3df;--h-tx:#7a3426;--m:#b8893d;--m-bg:#f7ecd6;--m-tx:#6b4c12;--l:#024950;--l-bg:#d9eef1;--l-tx:#024950}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#f4f9fa;color:var(--ink);font:15px/1.5 "Plus Jakarta Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
h1,h2,h3{font-family:"Fraunces",Georgia,"Times New Roman",serif;line-height:1.2;margin:0}
.pg,.pg>tbody,.pg>tbody>tr,.pg>tbody>tr>td{display:block}
.pg>tfoot,.pf{display:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.band{background:var(--teal);color:#fff;padding:28px 0 24px}
.band .wrap{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center}
.band img{display:block;width:140px;height:auto}
.band .tt{flex:1 1 320px;min-width:0}
.eb{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cfeef2}
.band h1{font-size:28px}
.band .ds{margin:6px 0 0;color:#e3f4f6}
.chips{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;width:100%}
.chips li{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600}
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
.card h3 small{font:600 13px/1.4 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;color:var(--body)}
.card .n{font:600 34px/1.1 "Fraunces",Georgia,serif;margin:10px 0 2px}
.card p{margin:0;color:var(--body)}
.card h4{margin:14px 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--body)}
.pills{list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0}
.pills li{background:var(--tint);border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12.5px;font-weight:600}
.acts{margin:0;padding-left:18px}
.acts li{margin:2px 0}
b.h,b.m,b.l{display:inline-block;border-radius:999px;padding:1px 10px;font:700 12px/1.5 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;border:1px solid}
b.h{background:var(--h-bg);color:var(--h-tx);border-color:var(--h)}
b.m{background:var(--m-bg);color:var(--m-tx);border-color:var(--m)}
b.l{background:var(--l-bg);color:var(--l-tx);border-color:var(--l)}
.scroll{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:14px}
.t{width:100%;min-width:760px;border-collapse:collapse;font-size:13.5px}
.t caption{text-align:left;padding:10px 14px 6px;font-weight:600;color:var(--body)}
.t th,.t td{padding:7px 12px;text-align:left;white-space:nowrap;border-top:1px solid var(--line)}
.t thead th{background:var(--tint);font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--teal)}
.t td:first-child{font-variant-numeric:tabular-nums;color:var(--body)}
.t td i{display:block;width:72px;height:3px;margin-top:3px;background:var(--line);border-radius:2px;overflow:hidden}
.t td i::after{content:"";display:block;height:100%;width:var(--w);background:var(--sec)}
.dist{margin:0 0 22px}
.dist h3{font-size:19px;margin-bottom:2px}
.dist h3 small{font:400 13px "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;color:var(--body)}
.areas{margin:0 0 10px;color:var(--body)}
details{margin-top:8px}
summary{cursor:pointer;font-weight:600;color:var(--teal);padding:6px 0}
.foot{border-top:1px solid var(--line);padding:16px 0 28px;color:var(--body);font-size:13px}
.foot p{margin:2px 0}
@media (max-width:600px){body{font-size:14px}.band h1{font-size:22px}.band img{width:112px}}
@page{size:A4;margin:15mm}
@media print{
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#fff;font-size:10pt}
.pg{display:table;width:100%;border-collapse:collapse}
.pg>tbody{display:table-row-group}.pg>tbody>tr{display:table-row}.pg>tbody>tr>td{display:table-cell;padding:0}
.pg>tfoot{display:table-footer-group}
.fsp{height:12mm}
.pf{display:block;position:fixed;left:0;right:0;bottom:0;font-size:7.5pt;line-height:1.35;color:var(--body);border-top:1px solid var(--line);padding-top:2mm;background:#fff}
.wrap{max-width:none;padding:0}
.band{padding:14px 16px;border-radius:10px}
.card,.note,.t tr,.dist h3,.areas{break-inside:avoid;page-break-inside:avoid}
h2,.lead,.dist h3,.areas{break-after:avoid;page-break-after:avoid}
.t{min-width:0;font-size:8.5pt}
.t thead{display:table-header-group}
.t th,.t td{padding:4px 7px}
.scroll{overflow:visible;border-radius:0}
summary{display:none}
}
"""

_CSS_PRINT_DETAILS = "@media print{details::details-content{content-visibility:visible;display:contents}}"

_SCRIPT = (
    "addEventListener('beforeprint',function(){"
    "document.querySelectorAll('details').forEach(function(d){d.open=true})});"
)


@lru_cache(maxsize=1)
def _logo_data_uri() -> str:
    return "data:image/png;base64," + base64.b64encode(LOGO_PATH.read_bytes()).decode("ascii")


def _generated_text(moment: datetime) -> str:
    return f"{moment:%b} {moment.day}, {moment:%Y %H:%M} (Asia/Manila)"


def _district_number(district: str) -> int:
    return _ROMAN.get(district_short(district), 99)


def _table_columns(columns: list[str]) -> list[tuple[str, str]]:
    selected = set(columns)
    place_header = {
        (True, True): "District and Area",
        (True, False): "District",
        (False, True): "Area",
    }.get(("district" in selected, "area" in selected))
    spec = [("rank", "Rank")]
    if "barangay" in selected:
        spec.append(("barangay", "Barangay"))
    if place_header:
        spec.append(("place", place_header))
    for key, label in (("hazard", "Hazard"), ("exposure", "Exposure"), ("vulnerability", "Vulnerability")):
        if key in selected:
            spec.append((key, label))
    if "dpi_scaled" in selected:
        spec.append(("dpi_scaled", "DPI"))
    if "priority_class" in selected:
        spec.append(("priority_class", "Priority"))
    return spec


def _cell(key: str, row: dict, columns: set[str]) -> str:
    if key == "place":
        parts = [
            district_short(row["district"]) if "district" in columns else "",
            (row["area"] or "") if "area" in columns else "",
        ]
        return f"<td>{escape(' · '.join(p for p in parts if p))}</td>"
    if key in ("hazard", "exposure", "vulnerability"):
        value = float(row[key])
        width = max(0, min(100, round(value * 100)))
        return f'<td>{value:.2f}<i style="--w:{width}%"></i></td>'
    if key == "dpi_scaled":
        return f"<td>{float(row[key]):.1f}</td>"
    if key == "priority_class":
        label = row[key]
        return f'<td><b class="{_BADGE.get(label, "l")}">{escape(label)}</b></td>'
    return f"<td>{escape(str(row[key]))}</td>"


def _table(caption: str, spec: list[tuple[str, str]], rows: list[dict], columns: set[str]) -> str:
    head = "".join(f'<th scope="col">{escape(label)}</th>' for _key, label in spec)
    body = "".join("<tr>" + "".join(_cell(key, row, columns) for key, _ in spec) + "</tr>" for row in rows)
    return (
        f'<div class="scroll"><table class="t"><caption>{escape(caption)}</caption>'
        f"<thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>"
    )


def _summary_cards(rows: list[dict], ranges: dict) -> str:
    counts = {label: 0 for label in class_guide.CLASS_ORDER}
    for row in rows:
        counts[row["priority_class"]] = counts.get(row["priority_class"], 0) + 1
    cards = "".join(
        f'<article class="card c-{_BADGE[label]}"><h3><b class="{_BADGE[label]}">{label}</b> priority</h3>'
        f'<p class="n">{counts[label]}</p><p>barangays &middot; {class_guide.range_text(ranges.get(label))}</p></article>'
        for label in class_guide.CLASS_ORDER
    )
    return (
        '<section aria-labelledby="s-sum"><h2 id="s-sum">Priority classes at a glance</h2>'
        f'<div class="cards">{cards}</div></section>'
    )


def _guide_cards(ranges: dict) -> str:
    cards = []
    for label in class_guide.CLASS_ORDER:
        guide = class_guide.CLASS_GUIDE[label]
        pills = "".join(f"<li>{escape(p)}</li>" for p in guide["pillars"])
        actions = "".join(f"<li>{escape(a)}</li>" for a in guide["actions"])
        cards.append(
            f'<article class="card c-{_BADGE[label]}"><h3><b class="{_BADGE[label]}">{label}</b>'
            f"<small>{class_guide.range_text(ranges.get(label))}</small></h3>"
            f'<h4>DRRM pillars</h4><ul class="pills">{pills}</ul>'
            f'<h4>Planning actions</h4><ul class="acts">{actions}</ul></article>'
        )
    return (
        '<section aria-labelledby="s-guide"><h2 id="s-guide">Priority class guide</h2>'
        f'<p class="lead">{escape(class_guide.TERTILE_NOTE)} DPI is the {class_guide.DPI_NAME}, scaled 0 to 100.</p>'
        f'<div class="cards">{"".join(cards)}</div></section>'
    )


def _district_sections(rows: list[dict], spec: list[tuple[str, str]], columns: set[str]) -> str:
    groups: dict[str, list[dict]] = {}
    for row in rows:
        groups.setdefault(row["district"] or "Unassigned", []).append(row)
    sections = []
    for district in sorted(groups, key=lambda name: (_district_number(name), name)):
        members = groups[district]
        areas = sorted({row["area"] for row in members if row["area"]})
        top, rest = members[:DISTRICT_PREVIEW_ROWS], members[DISTRICT_PREVIEW_ROWS:]
        slug = district_short(district).lower()
        more = ""
        if rest:
            more = (
                f"<details><summary>Show the other {len(rest)} barangays in {escape(district)}</summary>"
                f"{_table(f'{district}: remaining barangays by DPI', spec, rest, columns)}</details>"
            )
        sections.append(
            f'<section class="dist" aria-labelledby="d-{slug}"><h3 id="d-{slug}">{escape(district)} '
            f"<small>{len(members)} barangays</small></h3>"
            f'<p class="areas">Areas: {escape(", ".join(areas)) or "Not mapped"}</p>'
            f"{_table(f'{district}: top {len(top)} by DPI', spec, top, columns)}{more}</section>"
        )
    return (
        '<section aria-labelledby="s-dist"><h2 id="s-dist">By district</h2>'
        '<p class="lead">Each district lists its barangays from highest to lowest DPI.</p>'
        f'{"".join(sections)}</section>'
    )


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
    document = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} &middot; Version {version}</title>
<style>{_CSS}{_CSS_PRINT_DETAILS}</style>
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
{_guide_cards(ranges)}
<section aria-labelledby="s-top"><h2 id="s-top">Top {TOP_ROWS} highest priority barangays</h2>
{_table(f"Top {TOP_ROWS} barangays by DPI (highest first)", spec, rows[:TOP_ROWS], selected)}
</section>
{_district_sections(rows, spec, selected)}
</main>
<footer class="foot"><div class="wrap">
<p><strong>{REPORT_TITLE}</strong> &middot; {meta_line} &middot; Generated {escape(_generated_text(generated_at))}</p>
<p>Scores shown to 2 decimals and DPI to 1 decimal for readability; stored data is unchanged.</p>
<p><strong>Disclaimer:</strong> {disclaimer_html}</p>
</div></footer>
</td></tr></tbody><tfoot><tr><td><div class="fsp"></div></td></tr></tfoot></table>
<div class="pf" aria-hidden="true">{REPORT_TITLE} &middot; {meta_line} &middot; {disclaimer_html}</div>
<script>{_SCRIPT}</script>
</body>
</html>
"""
    return document.encode("utf-8")
