import api from './api'

const ADMIN_BASE = '/admin/public-exports'

export async function fetchPublicExports() {
  const { data } = await api.get(ADMIN_BASE)
  return data
}

export async function createPublicExport(payload) {
  const { data } = await api.post(ADMIN_BASE, payload)
  return data
}

export async function updatePublicExport(id, payload) {
  const { data } = await api.patch(`${ADMIN_BASE}/${id}`, payload)
  return data
}

export async function approvePublicExport(id) {
  const { data } = await api.post(`${ADMIN_BASE}/${id}/approve`)
  return data
}

export async function rejectPublicExport(id, reason) {
  const { data } = await api.post(`${ADMIN_BASE}/${id}/reject`, { reason })
  return data
}

export async function unpublishPublicExport(id, reason) {
  const { data } = await api.post(`${ADMIN_BASE}/${id}/unpublish`, { reason })
  return data
}

export async function fetchPublicExportAudit(id) {
  const { data } = await api.get(`${ADMIN_BASE}/${id}/audit`)
  return data
}

export async function downloadPublicExportPreview(id, filename) {
  const { data } = await api.get(`${ADMIN_BASE}/${id}/preview`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function fetchPublishedExports() {
  const { data } = await api.get('/public/exports')
  return data
}

/* Served as an attachment straight from the stored snapshot, so a plain link is enough. */
export function publishedExportDownloadUrl(kind) {
  return `${api.defaults.baseURL}/public/exports/${kind}/download`
}
