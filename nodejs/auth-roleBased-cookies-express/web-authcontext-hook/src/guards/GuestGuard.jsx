import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '~/hooks/useAuth'
import LoadingSpinner from '~/components/Loading/LoadingSpinner'

/**
 * GuestGuard - Protects routes that should only be accessible to guests
 * Redirects to dashboard if user is already authenticated
 */
function GuestGuard() {
  const { isAuthenticated, isInitialized } = useAuth()

  // Show loading while checking auth state
  if (!isInitialized) {
    return <LoadingSpinner />
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Render child routes
  return <Outlet />
}

export default GuestGuard
