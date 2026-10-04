/*
 * Admin and public calls for approved CSV and HTML exports.
 * The admin Public Exports page uses the /admin/public-exports routes.
 * The priority map uses the published list and the download URL.
 */
import api from './api'

// Shared prefix for the admin export routes.
const ADMIN_BASE = '/admin/public-exports'

// Every export version for the admin table.
export async function fetchPublicExports() {
  const { data } = await api.get(ADMIN_BASE)
  return data
}

// Save a new draft from the admin form.
export async function createPublicExport(payload) {
  const { data } = await api.post(ADMIN_BASE, payload)
  return data
}

// Patch one export with the fields the admin page edited.
export async function updatePublicExport(id, payload) {
  const { data } = await api.patch(`${ADMIN_BASE}/${id}`, payload)
  return data
}

// Approve an export so the public map can offer the download.
export async function approvePublicExport(id) {
  const { data } = await api.post(`${ADMIN_BASE}/${id}/approve`)
  return data
}

// Reject an export and store the reason on the record.
export async function rejectPublicExport(id, reason) {
  const { data } = await api.post(`${ADMIN_BASE}/${id}/reject`, { reason })
  return data
}

// Take a published export off the public map and store the reason.
export async function unpublishPublicExport(id, reason) {
  const { data } = await api.post(`${ADMIN_BASE}/${id}/unpublish`, { reason })
  return data
}

// History rows for one export, shown on the admin page.
export async function fetchPublicExportAudit(id) {
  const { data } = await api.get(`${ADMIN_BASE}/${id}/audit`)
  return data
}

// Download the stored preview in the browser as a file.
export async function downloadPublicExportPreview(id, filename) {
  const { data } = await api.get(`${ADMIN_BASE}/${id}/preview`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Published CSV and report metadata for the priority map buttons.
export async function fetchPublishedExports() {
  const { data } = await api.get('/public/exports')
  return data
}

/* Served as an attachment straight from the stored snapshot, so a plain link is enough. */
export function publishedExportDownloadUrl(kind) {
  return `${api.defaults.baseURL}/public/exports/${kind}/download`
}
