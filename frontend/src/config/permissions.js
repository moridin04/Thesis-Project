export const ROLE_STAFF = 'staff'
export const ROLE_ADMIN = 'admin'

export const PERMISSIONS = {
  BARANGAY_VIEW_INTERNAL: 'barangay:view_internal',
  BARANGAY_PREPARE: 'barangay:prepare',
  BARANGAY_PUBLISH: 'barangay:publish',
  DATASET_UPLOAD: 'dataset:upload',
  DATASET_SUBMIT: 'dataset:submit',
  DATASET_PUBLISH: 'dataset:publish',
  MODEL_VIEW: 'model:view',
  MODEL_SUBMIT: 'model:submit',
  MODEL_PUBLISH: 'model:publish',
  REPORT_PREPARE: 'report:prepare',
  REPORT_PUBLISH: 'report:publish',
  CONTENT_PREPARE: 'content:prepare',
  CONTENT_PUBLISH: 'content:publish',
  AUDIT_VIEW: 'audit:view',
  ACCOUNT_MANAGE: 'account:manage',
  ROLE_MANAGE: 'role:manage',
}

const STAFF = new Set([
  PERMISSIONS.BARANGAY_VIEW_INTERNAL,
  PERMISSIONS.BARANGAY_PREPARE,
  PERMISSIONS.DATASET_UPLOAD,
  PERMISSIONS.DATASET_SUBMIT,
  PERMISSIONS.MODEL_VIEW,
  PERMISSIONS.MODEL_SUBMIT,
  PERMISSIONS.REPORT_PREPARE,
  PERMISSIONS.CONTENT_PREPARE,
])

const ADMIN = new Set([
  ...STAFF,
  PERMISSIONS.BARANGAY_PUBLISH,
  PERMISSIONS.DATASET_PUBLISH,
  PERMISSIONS.MODEL_PUBLISH,
  PERMISSIONS.REPORT_PUBLISH,
  PERMISSIONS.CONTENT_PUBLISH,
  PERMISSIONS.AUDIT_VIEW,
  PERMISSIONS.ACCOUNT_MANAGE,
  PERMISSIONS.ROLE_MANAGE,
])

export function permissionsForRole(role) {
  if (role === ROLE_ADMIN) return ADMIN
  if (role === ROLE_STAFF) return STAFF
  return new Set()
}

export function hasPermission(role, permission) {
  return permissionsForRole(role).has(permission)
}

export function homePathForRole(role) {
  if (role === ROLE_ADMIN || role === ROLE_STAFF) return '/dashboard/overview'
  return '/'
}
