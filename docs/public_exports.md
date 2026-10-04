# Public exports

Admins prepare public exports in Admin Panel > Public Exports. A draft is rendered to a stored
snapshot; approval writes the final snapshot, and the public Priority Map serves only the latest
approved snapshot of each kind. Approved snapshots are never rewritten: a format change applies to
new drafts, and an existing approved export stays as it is until a newer version supersedes it.

DPI is the **Disaster Prioritization Index** everywhere (code, exports, docs).

Suggested titles (placeholders, no file extension): `AGOS Barangay Risk Summary - CSV` and
`AGOS Barangay Risk Summary - Report`.

## Public-safe columns

Only these fields can be selected, in this order (`backend/app/exports/records.py`): barangay,
district, area, dpi_scaled, priority_class, population_2024, flood_pct_5yr, flood_pct_25yr,
elevation_mean, hazard, exposure, vulnerability, planning_reference, drrm_pillar.

Barangay, DPI_Scaled and Priority_Class are required. If Planning_Reference or DRRM_Pillar is
selected, Priority_Class is included automatically. Staff-only fields (model-predicted class,
confidence, agreement, upload metadata, anything else) are rejected with 422.

District and Area come from the shared mapping in `backend/app/services/barangay_data.py`.
Planning_Reference and DRRM_Pillar are not stored per barangay: they are looked up from
`backend/app/exports/class_guide.py` by priority class.

## CSV (`AGOS_Barangay_Risk_Summary_v{version}_{YYYY-MM-DD}.csv`)

UTF-8 with BOM, CRLF line endings, and standard CSV quoting for text that contains commas.
Comment lines start with `# ` and come before the column row:

- `# AGOS Barangay Risk Summary` (plus `# Title:` and `# Description:` when set)
- `# Version: N | Data version: X | Generated: YYYY-MM-DD HH:MM (Asia/Manila) | Records: 897`
- `# Source: Verified analytical dataset (barangay_flood_risk_predictions.csv)`
- `# Disclaimer: ...` (the approved disclaimer, unchanged)
- `# Priority classes are relative tertiles across Manila barangays.`
- `# Columns: ...` (Rank by DPI_Scaled; DPI name; flood percent 0 to 100; elevation in meters)
- `# Rounding: ...`

Columns (only the selected ones after Rank): `Rank, Barangay, District, Area, DPI_Scaled,
Priority_Class, Population_2024, Flood_PCT_5yr, Flood_PCT_25yr, Elevation_Mean, Hazard, Exposure,
Vulnerability, Planning_Reference, DRRM_Pillar`. Rank is by DPI_Scaled, highest first, ties by
barangay number.

Rounding is display-only; stored data is unchanged:

- DPI_Scaled, Flood_PCT_5yr, Flood_PCT_25yr, Elevation_Mean: 2 decimals
- Hazard, Exposure, Vulnerability: 4 decimals
- Population_2024: whole number, no thousands separator
- flood percent cells are numbers 0 to 100 (the unit is in the header, not a `%` sign)

The last line repeats the disclaimer. `pandas.read_csv(path, comment="#")` loads 897 rows.

## HTML report (`AGOS_Barangay_Risk_Report_v{version}_{YYYY-MM-DD}.html`)

One self-contained file (inline CSS, embedded logo, one inline `<script>`, no external requests):

1. Teal header band with the AGOS logo, title and chips for Version, Data version, Generated and Records
2. Disclaimer callout
3. Summary cards: High, Medium and Low counts, DPI ranges and population covered, plus the citywide
   Population (2024) represented figure computed from the rows
4. One table of all 897 barangays in rank order, with a controls bar and pager (JavaScript only)
5. Footer with version, data version and disclaimer

All 897 rows are server-rendered. JavaScript only toggles the `hidden` attribute; without JavaScript
every row is visible and the pager is hidden. Page size defaults to 50 (25 / 50 / 100). Search
(barangay name or number) and Priority / District filters apply to all rows first, then paging.
Rank numbers stay the overall rank. State is stored in the URL hash (page, size, class, district,
q). Invalid hash values fall back to defaults.

Table columns match the CSV (District and Area share one cell, e.g. `III · Santa Cruz`). Numbers
are right-aligned with tabular figures; population uses a thousands separator; DPI, flood percent
and elevation use 2 decimals. Priority is a coloured badge with text. Planning_Reference is about
260px wrapping text; DRRM_Pillar is about 200px with one chip per pillar. A CSS-only “Hide planning
columns” checkbox compacts the screen view; print always shows those columns.

Print: A4 landscape with 12 mm margins, repeating table headers, every row visible (including those
hidden by the pager), colours kept, planning columns visible, and a running footer with the version
and disclaimer on every page. The pager and controls are hidden in print.

## Audit trail

Every export and report event is written to `audit_logs`, the table behind Admin Panel > Audit Log:
`export_created`, `export_edited` (lists only the fields that actually changed), `export_previewed`, `export_approved`, `export_superseded`
(user `system`), `export_rejected`, `export_unpublished`, `export_downloaded_public` (user `public`),
`report_downloaded` and `report_regenerated`. Public downloads store no IP address, user agent or
cookie; repeats of the same export within 10 minutes update one row with a count, e.g.
`CSV v2 (x14)`. A failed audit write never blocks a download. Audit rows have no edit or delete
route.
