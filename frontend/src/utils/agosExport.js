export const EXPORT_TITLE = 'AGOS Barangay Risk Summary'
export const EXPORT_SOURCE =
  'Verified analytical dataset (barangay_flood_risk_predictions.csv)'
export const EXPORT_DISCLAIMER = 'For information purposes only. Not a warning system.'

export const EXPORT_COLUMNS = [
  { key: 'barangay', label: 'Barangay name' },
  { key: 'district', label: 'District' },
  { key: 'priorityScore', label: 'Priority score' },
  { key: 'riskLevel', label: 'Risk Priority Class' },
  { key: 'population', label: 'Population (2024)' },
  { key: 'floodPct5yr', label: 'Flood PCT 5yr' },
  { key: 'floodPct25yr', label: 'Flood PCT 25yr' },
  { key: 'elevationMean', label: 'Elevation_Mean' },
]

export function exportDateStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function exportBasename(date = new Date()) {
  return `AGOS_Barangay_Risk_Summary_${exportDateStamp(date)}`
}

function cell(column, value) {
  if (value == null || value === '') return ''
  if (column.key === 'population') return String(Math.round(Number(value)))
  if (typeof value === 'number') return value.toFixed(6)
  return String(value)
}

function csvEscape(column, value) {
  const text = cell(column, value)
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function rowsToCsv(rows) {
  const header = EXPORT_COLUMNS.map((column) => column.label).join(',')
  const body = rows.map((row) => EXPORT_COLUMNS.map((column) => csvEscape(column, row[column.key])).join(','))
  return [header, ...body].join('\n')
}

export function buildReportHtml(rows, date = new Date()) {
  const stamp = exportDateStamp(date)
  const counts = rows.reduce(
    (totals, row) => {
      const label = row.riskLevel
      if (label && totals[label] != null) totals[label] += 1
      totals.population += Number(row.population) || 0
      return totals
    },
    { Low: 0, Medium: 0, High: 0, population: 0 },
  )
  const tableRows = rows
    .map(
      (row) => `<tr>${EXPORT_COLUMNS.map((column) => `<td>${escapeHtml(cell(column, row[column.key]))}</td>`).join('')}</tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${EXPORT_TITLE}</title>
  <style>
    body { font-family: "Plus Jakarta Sans", sans-serif; color: #003135; margin: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { font-size: 0.9rem; line-height: 1.5; }
    .disclaimer { margin-top: 0.75rem; padding: 0.75rem 1rem; background: #afdde5; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.8rem; }
    th, td { border-bottom: 1px solid #afdde5; text-align: left; padding: 0.4rem 0.5rem; }
    th { background: #024950; color: #fff; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${EXPORT_TITLE}</h1>
  <p class="meta"><strong>Date Generated:</strong> ${stamp}</p>
  <p class="meta"><strong>Source:</strong> ${escapeHtml(EXPORT_SOURCE)}</p>
  <p class="disclaimer"><strong>Disclaimer:</strong> ${escapeHtml(EXPORT_DISCLAIMER)}</p>
  <p class="meta">Records in this view: ${rows.length}. High ${counts.High}, Medium ${counts.Medium}, Low ${counts.Low}. Population (2024) represented: ${Math.round(counts.population).toLocaleString('en-PH')}.</p>
  <table>
    <thead><tr>${EXPORT_COLUMNS.map((column) => `<th>${column.label}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function downloadTextFile(filename, contents, mimeType) {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
