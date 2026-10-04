/*
 * Column lists and button labels for public CSV and HTML exports.
 * The admin Public Exports page and the priority map both use this.
 * DEFAULT_DISCLAIMER is the same sentence as content/disclaimer.js.
 */
// The two files an admin can publish.
export const EXPORT_KINDS = [
  { value: 'csv', label: 'CSV' },
  { value: 'report', label: 'Report' },
]

// Suggested titles. The admin can still type a different one.
export const TITLE_PLACEHOLDERS = {
  csv: 'AGOS Barangay Risk Summary - CSV',
  report: 'AGOS Barangay Risk Summary - Report',
}

/* Mirrors the server whitelist; the server rejects anything else with 422. */
export const PUBLIC_EXPORT_COLUMNS = [
  { key: 'barangay', label: 'Barangay' },
  { key: 'district', label: 'District' },
  { key: 'area', label: 'Area' },
  { key: 'dpi_scaled', label: 'DPI_Scaled' },
  { key: 'priority_class', label: 'Priority_Class' },
  { key: 'population_2024', label: 'Population_2024' },
  { key: 'flood_pct_5yr', label: 'Flood_PCT_5yr' },
  { key: 'flood_pct_25yr', label: 'Flood_PCT_25yr' },
  { key: 'elevation_mean', label: 'Elevation_Mean' },
  { key: 'hazard', label: 'Hazard' },
  { key: 'exposure', label: 'Exposure' },
  { key: 'vulnerability', label: 'Vulnerability' },
  { key: 'planning_reference', label: 'Planning_Reference' },
  { key: 'drrm_pillar', label: 'DRRM_Pillar' },
]

// Groups for the column checklist on the admin form.
export const PUBLIC_EXPORT_COLUMN_GROUPS = [
  { id: 'identity', label: 'Identity', keys: ['barangay', 'district', 'area'] },
  { id: 'scores', label: 'Scores', keys: ['dpi_scaled', 'priority_class', 'hazard', 'exposure', 'vulnerability'] },
  { id: 'context', label: 'Context', keys: ['population_2024', 'flood_pct_5yr', 'flood_pct_25yr', 'elevation_mean'] },
  { id: 'planning', label: 'Planning', keys: ['planning_reference', 'drrm_pillar'] },
]

// Always included. The checklist cannot turn these off.
export const MANDATORY_EXPORT_COLUMNS = ['barangay', 'dpi_scaled', 'priority_class']

// Lookup from a column key to its label.
const COLUMN_BY_KEY = Object.fromEntries(PUBLIC_EXPORT_COLUMNS.map((column) => [column.key, column]))

export { DISCLAIMER_CORE as DEFAULT_DISCLAIMER } from '../content/disclaimer.js'

// Words for the status badges on the admin export table.
export const STATUS_LABELS = {
  draft: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
  unpublished: 'Unpublished',
  superseded: 'Superseded',
}

// "CSV" or "Report". An unknown kind is shown as it is stored.
export function kindLabel(kind) {
  return EXPORT_KINDS.find((item) => item.value === kind)?.label ?? kind
}

// Placeholder title for this kind, or the CSV title if the kind is unknown.
export function titlePlaceholder(kind) {
  return TITLE_PLACEHOLDERS[kind] ?? TITLE_PLACEHOLDERS.csv
}

// True for barangay, scaled DPI, and priority class.
export function isMandatoryExportColumn(key) {
  return MANDATORY_EXPORT_COLUMNS.includes(key)
}

// Header text for one column key.
export function exportColumnLabel(key) {
  return COLUMN_BY_KEY[key]?.label ?? key
}

/** True when Planning or DRRM is selected without Priority_Class. */
export function planningNeedsPriorityClass(columns) {
  const selected = new Set(columns)
  return (selected.has('planning_reference') || selected.has('drrm_pillar')) && !selected.has('priority_class')
}

// Add or remove a column and keep the whitelist order.
// Choosing a planning field also keeps priority class selected.
export function toggleExportColumn(columns, key) {
  if (isMandatoryExportColumn(key)) {
    return PUBLIC_EXPORT_COLUMNS.map((column) => column.key).filter((item) => columns.includes(item) || item === key)
  }
  const selected = new Set(columns)
  if (selected.has(key)) selected.delete(key)
  else selected.add(key)
  if (planningNeedsPriorityClass(selected)) selected.add('priority_class')
  return PUBLIC_EXPORT_COLUMNS.map((column) => column.key).filter((item) => selected.has(item))
}

// Short Manila date, or an empty string when the timestamp is missing.
export function formatApprovedDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Public Priority Map button state for one export kind, given GET /public/exports metadata. */
export function publicExportButtonState(published, kind) {
  const meta = (published ?? []).find((item) => item.kind === kind)
  if (!meta) {
    return { available: false, label: 'Not yet available', detail: 'No approved export has been published yet.' }
  }
  const date = formatApprovedDate(meta.approved_at)
  return {
    available: true,
    label: kind === 'csv' ? 'Export as CSV' : 'Export as Report',
    detail: date ? `Version ${meta.version}, approved ${date}` : `Version ${meta.version}`,
    meta,
  }
}

/** One line for the Priority Map export card, e.g. "Approved: CSV v2 (Oct 4, 2026)". */
export function publishedExportsSummary(published) {
  const parts = EXPORT_KINDS.flatMap(({ value, label }) => {
    const meta = (published ?? []).find((item) => item.kind === value)
    if (!meta) return []
    const date = formatApprovedDate(meta.approved_at)
    return [`${label} v${meta.version}${date ? ` (${date})` : ''}`]
  })
  return parts.length ? `Approved: ${parts.join(' · ')}` : ''
}

// Download name for an admin preview, including the version number.
export function previewFilename(item) {
  const extension = item.kind === 'csv' ? 'csv' : 'html'
  return `AGOS_public_export_${item.kind}_v${item.version}_preview.${extension}`
}
