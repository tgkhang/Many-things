import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '~/hooks/useAuth'
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
 * Level 2: RoleGuard - Role-based access control
 *
 * Protects routes based on user roles (admin, moderator, client)
 * This is simpler than permission-based but less flexible
 *
 * Usage:
 * <Route element={<RoleGuard allowedRoles={['admin', 'moderator']} />}>
 *   <Route path="/reports" element={<Reports />} />
 * </Route>
 *
 * @param {string[]} allowedRoles - Array of roles that can access the route
 * @param {string} redirectTo - Optional path to redirect unauthorized users
 */
function RoleGuard({ allowedRoles = [], redirectTo = null }) {
  const { user, isAuthenticated } = useAuth()

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user's role is in allowed roles
  const userRole = user?.role || 'client'
  const hasAccess = allowedRoles.includes(userRole)

  // If not authorized and redirect path provided, redirect
  if (!hasAccess && redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // If not authorized, show access denied page
  if (!hasAccess) {
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
              You do not have the required role to access this page.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Required Role(s): <strong>{allowedRoles.join(', ')}</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your Role: <strong>{userRole}</strong>
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

  // User has access, render child routes
  return <Outlet />
}

export default RoleGuard
