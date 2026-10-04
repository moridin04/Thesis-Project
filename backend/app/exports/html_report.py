"""Self-contained public HTML report: inline CSS, embedded logo, no external requests."""

from __future__ import annotations

import base64
from datetime import datetime
from functools import lru_cache
from html import escape
from pathlib import Path

from app.exports import class_guide
from app.exports.records import district_short, place_label

REPORT_TITLE = "AGOS Barangay Risk Report"
LOGO_PATH = Path(__file__).resolve().parent / "assets" / "agos-logo-white.png"

_BADGE = {"High": "h", "Medium": "m", "Low": "l"}

_CSS = """
:root{--teal:#024950;--ink:#003135;--body:#3d6265;--line:#d7e6e8;--tint:#e9f5f7;--sec:#0fa4af;
--h:#964734;--h-bg:#f3e3df;--h-tx:#7a3426;--m:#b8893d;--m-bg:#f7ecd6;--m-tx:#6b4c12;--l:#024950;--l-bg:#d9eef1;--l-tx:#024950}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#f4f9fa;color:var(--ink);font:15px/1.5 "Plus Jakarta Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
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
.card .n{font:600 34px/1.1 "Fraunces",Georgia,serif;margin:10px 0 2px}
.card p{margin:0;color:var(--body)}
b.h,b.m,b.l{display:inline-block;border-radius:999px;padding:1px 10px;font:700 12px/1.5 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;border:1px solid}
b.h{background:var(--h-bg);color:var(--h-tx);border-color:var(--h)}
b.m{background:var(--m-bg);color:var(--m-tx);border-color:var(--m)}
b.l{background:var(--l-bg);color:var(--l-tx);border-color:var(--l)}
.f{position:absolute;opacity:0;pointer-events:none}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}
.bar label{background:#fff;border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--teal)}
#pc-all:checked~.bar [for=pc-all],#pc-h:checked~.bar [for=pc-h],#pc-m:checked~.bar [for=pc-m],#pc-l:checked~.bar [for=pc-l],#hp:checked~.bar [for=hp]{background:var(--teal);color:#fff;border-color:var(--teal)}
#pc-h:checked~.scroll tbody tr:not(.h),#pc-m:checked~.scroll tbody tr:not(.m),#pc-l:checked~.scroll tbody tr:not(.l){display:none}
#hp:checked~.scroll .plan{display:none}
.scroll{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:14px}
.t{width:100%;min-width:1180px;border-collapse:collapse;font-size:13px;table-layout:auto}
.t caption{text-align:left;padding:10px 14px 6px;font-weight:600;color:var(--body)}
.t th,.t td{padding:7px 10px;text-align:left;border-top:1px solid var(--line);vertical-align:top;white-space:nowrap}
.t thead th{position:sticky;top:0;z-index:1;background:var(--tint);font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--teal)}
.t tbody tr:nth-child(even) td{background:#f7fbfc}
.t tbody tr:hover td{background:#eef7f8}
.t .n,.t td:first-child{text-align:right;font-variant-numeric:tabular-nums}
.t td:first-child{color:var(--body)}
.t td.plan,.t th.plan{white-space:normal;width:14rem;min-width:14rem;max-width:14rem}
.pr{font-size:12px;line-height:1.35;color:var(--body)}
.pl{display:flex;flex-wrap:wrap;gap:4px}
.pl i{display:inline-block;background:var(--tint);border:1px solid var(--line);border-radius:999px;padding:1px 8px;font:600 11px/1.4 "Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;font-style:normal}
.foot{border-top:1px solid var(--line);padding:16px 0 28px;color:var(--body);font-size:13px}
.foot p{margin:2px 0}
@media (max-width:600px){body{font-size:14px}.band h1{font-size:22px}.band img{width:112px}}
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
.t{min-width:0;font-size:8pt}
.t thead{display:table-header-group}
.t th,.t td{padding:3px 5px}
.scroll{overflow:visible;border-radius:0}
.t tbody tr{display:table-row !important}
.t td.plan,.t th.plan{display:table-cell !important;width:32mm;min-width:28mm;max-width:36mm;white-space:normal;font-size:6.5pt}
.bar,.f{display:none}
}
"""


@lru_cache(maxsize=1)
def _logo_data_uri() -> str:
    return "data:image/png;base64," + base64.b64encode(LOGO_PATH.read_bytes()).decode("ascii")


def _generated_text(moment: datetime) -> str:
    return f"{moment:%b} {moment.day}, {moment:%Y %H:%M} (Asia/Manila)"


def _table_columns(columns: list[str]) -> list[tuple[str, str, str]]:
    """(key, header, extra class)."""
    selected = set(columns)
    spec: list[tuple[str, str, str]] = [("rank", "Rank", "")]
    if "barangay" in selected:
        spec.append(("barangay", "Barangay", ""))
    if "district" in selected or "area" in selected:
        header = { (True, True): "District and Area", (True, False): "District", (False, True): "Area" }[
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
    numeric = {"dpi_scaled", "population_2024", "flood_pct_5yr", "flood_pct_25yr", "elevation_mean", "hazard", "exposure", "vulnerability"}
    planning = {"planning_reference", "drrm_pillar"}
    for key, label in mapping:
        if key not in selected:
            continue
        extra = "n" if key in numeric else ""
        if key in planning:
            extra = (extra + " plan").strip()
            if key == "planning_reference":
                extra += " pr"
        spec.append((key, label, extra))
    return spec


def _num(value, decimals: int) -> str:
    return "" if value is None else f"{float(value):.{decimals}f}"


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
        pills = "".join(f"<i>{escape(p)}</i>" for p in class_guide.CLASS_GUIDE[row["priority_class"]]["pillars"])
        return f'<td class="plan"><span class="pl">{pills}</span></td>'
    return f"<td{cls}>{escape(str(row[key]))}</td>"


def _table(caption: str, spec: list[tuple[str, str, str]], rows: list[dict], columns: set[str]) -> str:
    head_cells = []
    for _key, label, extra in spec:
        attr = f' class="{extra}"' if extra else ""
        head_cells.append(f'<th scope="col"{attr}>{escape(label)}</th>')
    head = "".join(head_cells)
    body = []
    for row in rows:
        badge = _BADGE.get(row["priority_class"], "l")
        cells = "".join(_cell(key, row, columns, extra) for key, _label, extra in spec)
        body.append(f'<tr class="{badge}">{cells}</tr>')
    return (
        f'<div class="scroll"><table class="t"><caption>{escape(caption)}</caption>'
        f"<thead><tr>{head}</tr></thead><tbody>{''.join(body)}</tbody></table></div>"
    )


def _population(row: dict) -> int:
    value = row.get("population_2024")
    return 0 if value is None else int(round(float(value)))


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
    planning_controls = ""
    if "planning_reference" in selected or "drrm_pillar" in selected:
        planning_controls = (
            '<input class="f" type="checkbox" id="hp">'
            '<div class="bar" role="group" aria-label="Table options">'
            '<label for="pc-all">All classes</label>'
            '<label for="pc-h">High</label>'
            '<label for="pc-m">Medium</label>'
            '<label for="pc-l">Low</label>'
            '<label for="hp">Hide planning columns</label>'
            "</div>"
        )
    else:
        planning_controls = (
            '<div class="bar" role="group" aria-label="Table options">'
            '<label for="pc-all">All classes</label>'
            '<label for="pc-h">High</label>'
            '<label for="pc-m">Medium</label>'
            '<label for="pc-l">Low</label>'
            "</div>"
        )
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
<input class="f" type="radio" name="pc" id="pc-all" checked>
<input class="f" type="radio" name="pc" id="pc-h">
<input class="f" type="radio" name="pc" id="pc-m">
<input class="f" type="radio" name="pc" id="pc-l">
{planning_controls}
{_table(f"All {len(rows)} Manila barangays by DPI, highest first", spec, rows, selected)}
</section>
</main>
<footer class="foot"><div class="wrap">
<p><strong>{REPORT_TITLE}</strong> &middot; {meta_line} &middot; Generated {escape(_generated_text(generated_at))}</p>
<p>DPI, flood percent and elevation shown to 2 decimals; Hazard, Exposure and Vulnerability to 4 decimals. Stored data is unchanged.</p>
<p><strong>Disclaimer:</strong> {disclaimer_html}</p>
</div></footer>
</td></tr></tbody><tfoot><tr><td><div class="fsp"></div></td></tr></tfoot></table>
<div class="pf" aria-hidden="true">{REPORT_TITLE} &middot; {meta_line} &middot; {disclaimer_html}</div>
</body>
</html>
"""
    return document.encode("utf-8")
