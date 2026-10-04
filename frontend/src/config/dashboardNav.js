import { ROLE_ADMIN, ROLE_STAFF } from './permissions.js'

/** Roles allowed into /dashboard/reports (the comprehensive PDF report). */
export const REPORT_ROUTE_ROLES = [ROLE_STAFF, ROLE_ADMIN]

export const DASHBOARD_NAV_ITEMS = [
  { key: 'overview', to: '/dashboard/overview', label: 'Overview' },
  { key: 'compare', to: '/dashboard/compare', label: 'Compare' },
  { key: 'indicators', to: '/dashboard/indicators', label: 'Indicators' },
  { key: 'recommendations', to: '/dashboard/recommendations', label: 'Recommendations' },
  { key: 'barangays', to: '/dashboard/barangays', label: 'Barangays' },
  { key: 'model-results', to: '/dashboard/model-results', label: 'Model Results' },
  { key: 'reports', to: '/dashboard/reports', label: 'Reports', roles: REPORT_ROUTE_ROLES },
  { key: 'upload', to: '/dashboard/upload', label: 'Upload Data' },
]

export function dashboardNavItemsForRole(role) {
  return DASHBOARD_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

export function canRegenerateReport(role) {
  return role === ROLE_ADMIN
}
