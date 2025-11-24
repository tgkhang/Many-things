import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '~/hooks/useAuth'
import LoadingSpinner from '~/components/Loading/LoadingSpinner'

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
function AuthGuard() {
  const { isAuthenticated, isInitialized } = useAuth()
  const location = useLocation()

  // Show loading while checking auth state
  if (!isInitialized) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render child routes
  return <Outlet />
}

export default AuthGuard
