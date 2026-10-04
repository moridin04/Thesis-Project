import { ROLE_ADMIN } from './permissions.js'

/** Roles allowed into every /admin route. */
export const ADMIN_ROUTE_ROLES = [ROLE_ADMIN]

export const ADMIN_NAV_ITEMS = [
  { key: 'review-uploads', to: '/admin/review-uploads', label: 'Review Uploads' },
  { key: 'public-exports', to: '/admin/public-exports', label: 'Public Exports' },
  { key: 'manage-users', to: '/admin/manage-users', label: 'Manage Users' },
  { key: 'audit-log', to: '/admin/audit-log', label: 'Audit Log' },
]

export function canAccessAdmin(role) {
  return ADMIN_ROUTE_ROLES.includes(role)
}

export function adminNavItemsForRole(role) {
  return canAccessAdmin(role) ? ADMIN_NAV_ITEMS : []
}
