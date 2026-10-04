/*
 * Dataset uploads for staff and the admin review queue.
 * UploadDataContext.jsx calls these for the upload and review pages.
 * Approve and reject go through the admin upload routes.
 */
import api from './api'

// Shape one upload row for the dashboard and admin tables.
function mapUpload(row) {
  return {
    id: row.id,
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name,
    barangayName: row.barangay_name,
    dataType: row.data_type,
    notes: row.notes ?? '',
    fileName: row.file_name ?? '',
    status: row.status,
    rejectionReason: row.rejection_reason ?? '',
    createdAt: row.created_at,
    barangayRecord: row.barangay_record ?? null,
  }
}

// Staff sends a file plus barangay, data type, and notes.
export async function submitUpload(formData) {
  const { data } = await api.post('/operations/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return mapUpload(data)
}

// Uploads that belong to the signed-in account.
export async function fetchMyUploads() {
  const { data } = await api.get('/operations/uploads')
  return data.map(mapUpload)
}

// Admin queue. An optional status, such as pending, filters the list.
export async function fetchAllUploads(status) {
  const { data } = await api.get('/admin/uploads', {
    params: status ? { status } : undefined,
  })
  return data.map(mapUpload)
}

// Admin accepts one upload.
export async function approveUpload(uploadId) {
  const { data } = await api.post(`/admin/uploads/${uploadId}/approve`)
  return mapUpload(data)
}

// Admin rejects one upload. The reason may be an empty string.
export async function rejectUpload(uploadId, rejectionReason = '') {
  const { data } = await api.post(`/admin/uploads/${uploadId}/reject`, {
    rejection_reason: rejectionReason,
  })
  return mapUpload(data)
}

// GET /public/approved-barangays. No page imports this helper yet.
export async function fetchApprovedBarangays() {
  const { data } = await api.get('/public/approved-barangays')
  return data
}
