/* Readable labels for audit_logs actions; unknown actions fall back to a humanised form. */
export const AUDIT_ACTION_LABELS = {
  login_success: 'Signed in',
  login_failed: 'Sign-in failed',
  account_created: 'Account created',
  account_role_updated: 'Account role changed',
  account_status_updated: 'Account status changed',
  upload_submitted: 'Upload submitted',
  upload_approved: 'Upload approved',
  upload_rejected: 'Upload rejected',
  dataset_approved: 'Dataset approved',
  dataset_published: 'Dataset published',
  dataset_archived: 'Dataset archived',
  export_created: 'Export created',
  export_edited: 'Export edited',
  export_previewed: 'Export previewed',
  export_approved: 'Export approved',
  export_superseded: 'Export superseded',
  export_rejected: 'Export rejected',
  export_unpublished: 'Export unpublished',
  export_downloaded_public: 'Public download',
  report_downloaded: 'Report downloaded',
  report_regenerated: 'Report regenerated',
}

/* Values match the `group` query parameter of GET /admin/audit-logs. */
export const AUDIT_ACTION_GROUPS = [
  { value: '', label: 'All' },
  { value: 'uploads', label: 'Uploads' },
  { value: 'exports', label: 'Exports' },
  { value: 'reports', label: 'Reports' },
  { value: 'accounts', label: 'Accounts' },
]

export const AUDIT_PAGE_SIZE = 50

export function auditActionLabel(action) {
  if (!action) return ''
  if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action]
  const words = action.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/* Query params for one page of the Audit Log; empty filters are omitted. */
export function auditLogParams({ group = '', date = '', offset = 0 } = {}) {
  const params = { limit: AUDIT_PAGE_SIZE, offset }
  if (group) params.group = group
  if (date) params.date = date
  return params
}

/* A full page means there may be more rows to load. */
export function hasMoreAuditRows(pageLength) {
  return pageLength === AUDIT_PAGE_SIZE
}
