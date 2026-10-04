/*
 * Staff download and admin rebuild of the comprehensive PDF.
 * DashboardReports.jsx uses these with comprehensiveReport.js for the name.
 * The PDF route needs the bearer token, so we fetch a blob.
 */
import api from './api'

// File size and generated time shown before the download button.
export async function fetchComprehensiveReportMeta() {
  const { data } = await api.get('/staff/reports/comprehensive/meta')
  return data
}

/* The endpoint needs the bearer token, so fetch it as a blob instead of a plain link. */
export async function fetchComprehensiveReportPdf() {
  const { data } = await api.get('/staff/reports/comprehensive', { responseType: 'blob' })
  return data
}

// Rebuild the PDF through the admin regenerate route.
export async function regenerateComprehensiveReport() {
  const { data } = await api.post('/admin/reports/comprehensive/regenerate')
  return data
}

// Start a file download from a blob without leaving the page.
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
