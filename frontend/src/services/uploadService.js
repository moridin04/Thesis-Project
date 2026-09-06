import api from './api'

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

export async function submitUpload(formData) {
  const { data } = await api.post('/operations/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return mapUpload(data)
}

export async function fetchMyUploads() {
  const { data } = await api.get('/operations/uploads')
  return data.map(mapUpload)
}

export async function fetchAllUploads(status) {
  const { data } = await api.get('/admin/uploads', {
    params: status ? { status } : undefined,
  })
  return data.map(mapUpload)
}

export async function approveUpload(uploadId) {
  const { data } = await api.post(`/admin/uploads/${uploadId}/approve`)
  return mapUpload(data)
}

export async function rejectUpload(uploadId, rejectionReason = '') {
  const { data } = await api.post(`/admin/uploads/${uploadId}/reject`, {
    rejection_reason: rejectionReason,
  })
  return mapUpload(data)
}

export async function fetchApprovedBarangays() {
  const { data } = await api.get('/public/approved-barangays')
  return data
}
