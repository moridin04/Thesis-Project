import api from './api'

export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard')
  return data
}

export async function fetchAccounts() {
  const { data } = await api.get('/admin/accounts')
  return data.map(mapAccount)
}

export async function createAccount(payload) {
  const { data } = await api.post('/admin/accounts', payload)
  return mapAccount(data)
}

export async function patchAccountRole(accountId, role) {
  const { data } = await api.patch(`/admin/accounts/${accountId}/role`, { role })
  return mapAccount(data)
}

export async function patchAccountStatus(accountId, isActive) {
  const { data } = await api.patch(`/admin/accounts/${accountId}/status`, {
    is_active: isActive,
  })
  return mapAccount(data)
}

export async function fetchAuditLogs() {
  const { data } = await api.get('/admin/audit-logs')
  return data.map(mapAuditLog)
}

export async function publishDataset(datasetId) {
  const { data } = await api.post(`/admin/datasets/${datasetId}/publish`)
  return data
}

function mapAccount(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.full_name,
    email: row.username,
    role: row.role,
    status: row.is_active ? 'active' : 'inactive',
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
  }
}

function mapAuditLog(row) {
  return {
    id: row.id,
    timestamp: row.created_at,
    user: row.actor_username ?? 'system',
    action: row.action,
    details: row.details ?? '',
  }
}
