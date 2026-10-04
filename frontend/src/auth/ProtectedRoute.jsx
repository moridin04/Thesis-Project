/*
 * Blocks routes that need a signed-in account.
 * App.jsx wraps the dashboard routes with this outlet.
 * Guests go to /login, and the page they wanted is kept in location state.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import LoadingScreen from '../components/shared/LoadingScreen'

// Wait for the session restore, then send guests to login.
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // AuthProvider is still asking the refresh cookie for an access token.
  if (loading) {
    return <LoadingScreen message="Restoring your session…" />
  }

  // Login reads state.from and sends staff or admin back to their page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
