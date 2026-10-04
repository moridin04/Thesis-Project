/*
 * Title, note, file size, and filename for the comprehensive PDF.
 * DashboardReports.jsx shows these next to the download button.
 * The filename date uses Asia/Manila, matching the backend PDF name.
 */
// Card title on the reports page.
export const REPORT_TITLE = 'Manila Barangay Flood Risk Comprehensive Report'

// Short description under the report title.
export const REPORT_DESCRIPTION =
  'Full methodology and results from the thesis notebook: data sources, entropy weights, DPI classes, model comparison, feature importance, audits and limitations.'

// Reminder that the classes are relative, not official flood warnings.
export const REPORT_NOTE =
  'For internal planning and research use. Classes are relative tertiles, not official flood warnings.'

// Clock for the generated time and for the date in the PDF filename.
const MANILA_TZ = 'Asia/Manila'

// Bytes as B, KB, or MB. A bad value becomes an empty string.
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Manila local time for the generated line. A bad date becomes empty.
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
