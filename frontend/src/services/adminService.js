/*
 * Admin account, audit log, dashboard, and dataset publish calls.
 * UploadDataContext uses the account helpers for Manage Users.
 * The audit log page calls fetchAuditLogs with filters from auditLog.js.
 */
import api from './api'

// Summary payload from GET /admin/dashboard. No page imports this yet.
export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard')
  return data
}

// Every account, mapped into the fields the user table reads.
export async function fetchAccounts() {
  const { data } = await api.get('/admin/accounts')
  return data.map(mapAccount)
}

// Create an account from the admin form.
export async function createAccount(payload) {
  const { data } = await api.post('/admin/accounts', payload)
  return mapAccount(data)
}

// Change one account's role. Only an admin token can call this route.
export async function patchAccountRole(accountId, role) {
  const { data } = await api.patch(`/admin/accounts/${accountId}/role`, { role })
  return mapAccount(data)
}

// Turn an account on or off. The table shows that as active or inactive.
export async function patchAccountStatus(accountId, isActive) {
  const { data } = await api.patch(`/admin/accounts/${accountId}/status`, {
    is_active: isActive,
  })
  return mapAccount(data)
}

// One page of audit rows. params come from auditLogParams in auditLog.js.
export async function fetchAuditLogs(params) {
  const { data } = await api.get('/admin/audit-logs', { params })
  return data.map(mapAuditLog)
}

// Publish a dataset by id. No page calls this helper yet.
export async function publishDataset(datasetId) {
  const { data } = await api.post(`/admin/datasets/${datasetId}/publish`)
  return data
}

// email is the username because the API does not send a separate email.
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

// A missing actor name is shown as system.
function mapAuditLog(row) {
  return {
    id: row.id,
    timestamp: row.created_at,
    user: row.actor_username ?? 'system',
    action: row.action,
    details: row.details ?? '',
  }
}
