/*
 * Limits a route to the roles passed in allowedRoles.
 * App.jsx uses this for admin pages. The wrong role is sent to /.
 * RedirectIfAuthenticated keeps a signed-in user off the login page.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import LoadingScreen from '../components/shared/LoadingScreen'
import { homePathForRole } from '../config/permissions'

// Renders the child route only when account.role is allowed.
export default function RoleRoute({ allowedRoles }) {
  const { account, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen message="Restoring your session…" />
  }

  // Same return path as ProtectedRoute, so login can send them back.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // A signed-in user with the wrong role goes to the public home.
  if (!allowedRoles.includes(account.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// Login wrapper. A signed-in user goes to the home for their role.
export function RedirectIfAuthenticated({ children }) {
  const { account, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Checking session…" />
  }

  // Admin and staff land on the dashboard. Other roles land on /.
  if (isAuthenticated) {
    return <Navigate to={homePathForRole(account.role)} replace />
  }

  return children
}
