import { useAuth } from '~/hooks/useAuth'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import HomeIcon from '@mui/icons-material/Home'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { Link } from 'react-router-dom'
import AppBar from '~/components/AppBar/AppBar'

function AdminPanel() {
  const { user: currentUser } = useAuth()

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" fontWeight="bold">
                Admin Panel
              </Typography>
            </Box>
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

          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Welcome to the Admin Panel
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              This page is only accessible to users with ADMIN role who have the MANAGE_USERS permission.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Current User:</strong> {currentUser?.displayName || currentUser?.username}
            </Typography>
            <Typography variant="body2">
              <strong>Role:</strong> {currentUser?.role}
            </Typography>

            <Box sx={{ mt: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                Admin Features:
              </Typography>
              <ul>
                <li>Manage user accounts</li>
                <li>Assign and modify user roles</li>
                <li>View system analytics</li>
                <li>Configure system settings</li>
              </ul>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Container>
  )
}

export default AdminPanel
