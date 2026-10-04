export const REPORT_TITLE = 'Manila Barangay Flood Risk Comprehensive Report'

export const REPORT_DESCRIPTION =
  'Full methodology and results from the thesis notebook: data sources, entropy weights, DPI classes, model comparison, feature importance, audits and limitations.'

export const REPORT_NOTE =
  'For internal planning and research use. Classes are relative tertiles, not official flood warnings.'

const MANILA_TZ = 'Asia/Manila'

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatGeneratedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-PH', {
    timeZone: MANILA_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Same name the backend sends: the Manila date the PDF was generated. */
export function reportFilename(generatedAt) {
  const date = generatedAt ? new Date(generatedAt) : new Date()
  const stamp = date.toLocaleDateString('en-CA', { timeZone: MANILA_TZ })
  return `Manila_Barangay_Flood_Risk_Comprehensive_Report_${stamp}.pdf`
}
