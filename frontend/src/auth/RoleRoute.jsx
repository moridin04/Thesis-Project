import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import LoadingScreen from '../components/shared/LoadingScreen'
import { homePathForRole } from '../config/permissions'

export default function RoleRoute({ allowedRoles }) {
  const { account, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen message="Restoring your session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(account.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function RedirectIfAuthenticated({ children }) {
  const { account, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Checking session…" />
  }

  if (isAuthenticated) {
    return <Navigate to={homePathForRole(account.role)} replace />
  }

  return children
}
