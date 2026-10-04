import api from './api'

export async function fetchComprehensiveReportMeta() {
  const { data } = await api.get('/staff/reports/comprehensive/meta')
  return data
}

/* The endpoint needs the bearer token, so fetch it as a blob instead of a plain link. */
export async function fetchComprehensiveReportPdf() {
  const { data } = await api.get('/staff/reports/comprehensive', { responseType: 'blob' })
  return data
}

export async function regenerateComprehensiveReport() {
  const { data } = await api.post('/admin/reports/comprehensive/regenerate')
  return data
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
