export const EXPORT_KINDS = [
  { value: 'csv', label: 'CSV' },
  { value: 'report', label: 'Report' },
]

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

export const PUBLIC_EXPORT_COLUMN_GROUPS = [
  { id: 'identity', label: 'Identity', keys: ['barangay', 'district', 'area'] },
  { id: 'scores', label: 'Scores', keys: ['dpi_scaled', 'priority_class', 'hazard', 'exposure', 'vulnerability'] },
  { id: 'context', label: 'Context', keys: ['population_2024', 'flood_pct_5yr', 'flood_pct_25yr', 'elevation_mean'] },
  { id: 'planning', label: 'Planning', keys: ['planning_reference', 'drrm_pillar'] },
]

export const MANDATORY_EXPORT_COLUMNS = ['barangay', 'dpi_scaled', 'priority_class']

const COLUMN_BY_KEY = Object.fromEntries(PUBLIC_EXPORT_COLUMNS.map((column) => [column.key, column]))

export { DISCLAIMER_CORE as DEFAULT_DISCLAIMER } from '../content/disclaimer.js'

export const STATUS_LABELS = {
  draft: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
  unpublished: 'Unpublished',
  superseded: 'Superseded',
}

export function kindLabel(kind) {
  return EXPORT_KINDS.find((item) => item.value === kind)?.label ?? kind
}

export function titlePlaceholder(kind) {
  return TITLE_PLACEHOLDERS[kind] ?? TITLE_PLACEHOLDERS.csv
}

export function isMandatoryExportColumn(key) {
  return MANDATORY_EXPORT_COLUMNS.includes(key)
}

export function exportColumnLabel(key) {
  return COLUMN_BY_KEY[key]?.label ?? key
}

/** True when Planning or DRRM is selected without Priority_Class. */
export function planningNeedsPriorityClass(columns) {
  const selected = new Set(columns)
  return (selected.has('planning_reference') || selected.has('drrm_pillar')) && !selected.has('priority_class')
}

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

export function previewFilename(item) {
  const extension = item.kind === 'csv' ? 'csv' : 'html'
  return `AGOS_public_export_${item.kind}_v${item.version}_preview.${extension}`
}
