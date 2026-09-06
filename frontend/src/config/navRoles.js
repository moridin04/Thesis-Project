import { ROLE_ADMIN, ROLE_STAFF } from './permissions'

/** UI-facing access tier for header navigation */
export const NAV_PUBLIC = 'public'
export const NAV_LGU = 'lgu'
export const NAV_ADMIN = 'admin'

export function navRoleFromAuth(isAuthenticated, role) {
  if (!isAuthenticated) return NAV_PUBLIC
  if (role === ROLE_ADMIN) return NAV_ADMIN
  if (role === ROLE_STAFF) return NAV_LGU
  return NAV_PUBLIC
}

export function backendRoleFromNav(navRole) {
  if (navRole === NAV_ADMIN) return ROLE_ADMIN
  if (navRole === NAV_LGU) return ROLE_STAFF
  return null
}
