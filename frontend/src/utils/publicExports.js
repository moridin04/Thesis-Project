export const EXPORT_KINDS = [
  { value: 'csv', label: 'CSV' },
  { value: 'report', label: 'Report' },
]

/* Mirrors the server whitelist; the server rejects anything else with 422. */
export const PUBLIC_EXPORT_COLUMNS = [
  { key: 'barangay', label: 'Barangay' },
  { key: 'district', label: 'District' },
  { key: 'area', label: 'Area' },
  { key: 'hazard', label: 'Hazard' },
  { key: 'exposure', label: 'Exposure' },
  { key: 'vulnerability', label: 'Vulnerability' },
  { key: 'dpi_scaled', label: 'DPI_Scaled' },
  { key: 'priority_class', label: 'Priority_Class' },
]

export const DEFAULT_DISCLAIMER =
  'For information purposes only. Not a warning system. Priority classes are relative tertiles across Manila barangays, not official flood warnings.'

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
