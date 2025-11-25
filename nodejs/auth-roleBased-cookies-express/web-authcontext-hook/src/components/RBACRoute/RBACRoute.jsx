import { Navigate } from 'react-router-dom'
import { useAuth } from '~/hooks/useAuth'
import { usePermission } from '~/hooks/usePermission'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import BlockIcon from '@mui/icons-material/Block'
import HomeIcon from '@mui/icons-material/Home'
import { Link } from 'react-router-dom'
import AppBar from '~/components/AppBar/AppBar'

/**
 * RBACRoute Component - Children Pattern for Permission-based Access Control
 *
 * Alternative to PermissionGuard when you want to wrap components directly
 * instead of using nested routes with <Outlet />
 *
 * Usage:
 * <Route path="/admin" element={
 *   <RBACRoute requiredPermission="manage_users">
 *     <AdminPanel />
 *   </RBACRoute>
 * } />
 *
 * @param {Object} props
 * @param {string|string[]} props.requiredPermission - Single permission or array of permissions required
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {boolean} props.requireAll - If true, user must have ALL permissions. If false, user needs ANY permission (default: false)
 * @param {string} props.redirectTo - Optional path to redirect unauthorized users instead of showing access denied
 */
function RBACRoute({
  requiredPermission,
  children,
  requireAll = false,
  redirectTo = null
}) {
  const { user, isAuthenticated } = useAuth()
  const { hasPermission } = usePermission(user?.role)

  // If no user is logged in, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace={true} />
  }

  // Check permissions
  const checkPermissions = () => {
    // If no permission required, allow access
    if (!requiredPermission) return true

    // Single permission check
    if (typeof requiredPermission === 'string') {
      return hasPermission(requiredPermission)
    }

    // Multiple permissions check
    if (Array.isArray(requiredPermission)) {
      if (requireAll) {
        // User must have ALL permissions
        return requiredPermission.every(permission => hasPermission(permission))
      } else {
        // User must have ANY permission
        return requiredPermission.some(permission => hasPermission(permission))
      }
    }

    return false
  }

  const isAuthorized = checkPermissions()

  // If not authorized and redirect path is provided, redirect
  if (!isAuthorized && redirectTo) {
    return <Navigate to={redirectTo} replace={true} />
  }

  // If not authorized, show access denied page
  if (!isAuthorized) {
    return (
      <Container disableGutters maxWidth={false}>
        <AppBar />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 58px)',
            p: 3,
            bgcolor: '#f5f5f5',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <BlockIcon
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 2
              }}
            />

            <Typography variant="h4" gutterBottom fontWeight="bold" color="error">
              Access Denied
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              You do not have the required permissions to access this page.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Required Permission: <strong>
                {Array.isArray(requiredPermission)
                  ? requiredPermission.join(requireAll ? ' AND ' : ' OR ')
                  : requiredPermission}
              </strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your Role: <strong>{user?.role || 'client'}</strong>
            </Typography>

            <Button
              component={Link}
              to="/dashboard"
              variant="contained"
              startIcon={<HomeIcon />}
              sx={{ textTransform: 'none' }}
            >
              Go to Dashboard
            </Button>
          </Paper>
        </Box>
      </Container>
    )
  }

  // User is authorized, render the children
  return <>{children}</>
}

export default RBACRoute
