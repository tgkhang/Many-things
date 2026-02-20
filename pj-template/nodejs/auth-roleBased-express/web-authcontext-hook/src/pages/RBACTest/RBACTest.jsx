import { useState } from 'react'
import { useAuth } from '~/hooks/useAuth'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import HomeIcon from '@mui/icons-material/Home'
import { Link } from 'react-router-dom'
import AppBar from '~/components/AppBar/AppBar'
import { usePermission } from '~/hooks/usePermission'
import { permissions } from '~/config/rbacConfig'

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function RBACTest() {
  const [tabValue, setTabValue] = useState(0)
  const { user: currentUser } = useAuth()
  const { hasPermission } = usePermission(currentUser?.role)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const PermissionDisplay = ({ permission, label, description }) => {
    const allowed = hasPermission(permission)

    return (
      <Alert
        severity={allowed ? 'success' : 'error'}
        icon={allowed ? <CheckCircleIcon fontSize="large" /> : <CancelIcon fontSize="large" />}
        sx={{ mb: 2 }}
      >
        <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          {allowed ? 'Access Granted' : 'Access Denied'}
        </AlertTitle>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>{label}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
          Permission: {permission}
        </Typography>
      </Alert>
    )
  }

  return (
    <Container disableGutters maxWidth={false}>
      <AppBar />
      <Box
        sx={{
          minHeight: 'calc(100vh - 58px)',
          p: 3,
          bgcolor: '#f5f5f5',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4" fontWeight="bold">
              RBAC Permission Testing
            </Typography>
            <Button
              component={Link}
              to="/dashboard"
              variant="outlined"
              startIcon={<HomeIcon />}
              sx={{ textTransform: 'none' }}
            >
              Back to Dashboard
            </Button>
          </Box>

          <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
            <Typography variant="body1">
              <strong>Current User:</strong> {currentUser?.displayName || currentUser?.username || 'User'}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {currentUser?.email}
            </Typography>
            <Typography variant="body1">
              <strong>Role:</strong> <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{currentUser?.role || 'client'}</span>
            </Typography>
          </Paper>

          <Paper elevation={3}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Dashboard & Profile" />
              <Tab label="Analytics" />
              <Tab label="User Management" />
              <Tab label="Settings" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Dashboard & Profile Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                These permissions control access to basic dashboard features and profile management.
              </Typography>

              <PermissionDisplay
                permission={permissions.VIEW_DASHBOARD}
                label="View Dashboard"
                description="Allows users to access and view the main dashboard with overview information."
              />

              <PermissionDisplay
                permission={permissions.EDIT_PROFILE}
                label="Edit Profile"
                description="Grants permission to modify user profile information including name and preferences."
              />

              <PermissionDisplay
                permission={permissions.CHANGE_PASSWORD}
                label="Change Password"
                description="Enables users to update their account password for security purposes."
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Analytics Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Control access to analytics and reporting features.
              </Typography>

              <PermissionDisplay
                permission={permissions.VIEW_ANALYTICS}
                label="View Analytics"
                description="Access detailed analytics, reports, and data visualization dashboards."
              />

              <PermissionDisplay
                permission={permissions.VIEW_AUDITS}
                label="View Audit Logs"
                description="View system audit logs and track user activities for security monitoring."
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                User Management Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Administrative permissions for managing users and their accounts.
              </Typography>

              <PermissionDisplay
                permission={permissions.MANAGE_USERS}
                label="Manage Users"
                description="Create, update, delete user accounts and assign roles. This is an admin-only permission."
              />

              <PermissionDisplay
                permission={permissions.VIEW_SESSION}
                label="View Sessions"
                description="Monitor and view active user sessions across the system."
              />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                System Settings Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Control access to system-wide settings and configurations.
              </Typography>

              <PermissionDisplay
                permission={permissions.MANAGE_SETTINGS}
                label="Manage System Settings"
                description="Modify system-wide configurations, security settings, and application parameters. Admin-only feature."
              />
            </TabPanel>
          </Paper>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> The permissions displayed above are based on your current role ({currentUser?.role || 'client'}).
              Different roles have different permission levels:
            </Typography>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li><strong>Admin:</strong> Full access to all features</li>
              <li><strong>Moderator:</strong> Access to analytics, audits, and sessions</li>
              <li><strong>Client:</strong> Basic access to dashboard and profile features</li>
            </ul>
          </Box>
        </Container>
      </Box>
    </Container>
  )
}

export default RBACTest
