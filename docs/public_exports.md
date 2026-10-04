# Public exports

Admins prepare public exports in Admin Panel > Public Exports. A draft is rendered to a stored
snapshot; approval writes the final snapshot, and the public Priority Map serves only the latest
approved snapshot of each kind. Approved snapshots are never rewritten: a format change applies to
new drafts, and an existing approved export stays as it is until a newer version supersedes it.

DPI is the **Disaster Prioritization Index** everywhere (code, exports, docs).

## Public-safe columns

Only these fields can be selected: barangay, district, area, hazard, exposure, vulnerability,
dpi_scaled, priority_class (`backend/app/exports/records.py`). District and Area come from the
shared district and area mapping in `backend/app/services/barangay_data.py`.

## Priority Class Guide

`backend/app/exports/class_guide.py` holds the guide for High, Medium and Low: DRRM pillars,
planning actions condensed from the pipeline's `Planning_Reference` and `DRRM_Pillar` wording, and
the DPI range of each class (computed from the exported rows). Both outputs render it from there;
it is never repeated on table rows.

## CSV (`AGOS_Barangay_Risk_Summary_v{version}_{YYYY-MM-DD}.csv`)

UTF-8 with BOM. Comment lines start with `# ` and come before the column row:

- `# AGOS Barangay Risk Summary` (plus `# Title:` and `# Description:` when set)
- `# Version: N | Data version: X | Generated: YYYY-MM-DD HH:MM (Asia/Manila) | Records: 897`
- `# Disclaimer: ...` (the approved disclaimer, unchanged)
- `# Priority classes are relative tertiles across Manila barangays.`
- Class guide: one line per class, e.g. `# High (DPI 22.93 to 100.00): pillars ...; planning: ...`
- `# Columns: ...` and `# Rounding: ...` notes

Columns: `Rank, Barangay, District, Area, Hazard, Exposure, Vulnerability, DPI_Scaled,
Priority_Class` (only the selected ones after Rank). Rank is by DPI_Scaled, highest first, ties by
barangay number. Hazard, Exposure and Vulnerability are rounded to 4 decimals and DPI_Scaled to 2
for readability; stored data is unchanged. The last line repeats the disclaimer.

`pandas.read_csv(path, comment="#")` loads 897 rows and 9 columns.

## HTML report (`AGOS_Barangay_Risk_Report_v{version}_{YYYY-MM-DD}.html`)

One self-contained file (inline CSS, embedded logo, no external requests, about 230 KB):

1. Teal header band with the AGOS logo, title and chips for Version, Data version, Generated and Records
2. Disclaimer callout
3. Summary cards: High, Medium and Low counts with DPI ranges
4. Priority class guide: pillars as chips, planning actions as bullets
5. Top 10 highest priority barangays
6. By district: District I to VI with area names, the top 10 of each district and a `<details>`
   expander for the rest
7. Footer with version, data version and disclaimer

Table columns: Rank, Barangay, District and Area (e.g. `III · Santa Cruz`), Hazard, Exposure and
Vulnerability (2 decimals with a thin bar), DPI (1 decimal), Priority badge (text plus color).

Print: A4 with 15 mm margins, cards and rows kept whole, headings kept with the content below them,
repeating table headers, every expander opened, colors kept, and a running footer with the version and disclaimer on every page.

## Audit trail

Every export and report event is written to `audit_logs`, the table behind Admin Panel > Audit Log:
`export_created`, `export_edited` (lists only the fields that actually changed), `export_previewed`, `export_approved`, `export_superseded`
(user `system`), `export_rejected`, `export_unpublished`, `export_downloaded_public` (user `public`),
`report_downloaded` and `report_regenerated`. Public downloads store no IP address, user agent or
cookie; repeats of the same export within 10 minutes update one row with a count, e.g.
`CSV v2 (x14)`. A failed audit write never blocks a download. Audit rows have no edit or delete
route.
