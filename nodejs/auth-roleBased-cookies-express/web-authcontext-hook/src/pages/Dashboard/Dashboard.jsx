import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import SettingsIcon from '@mui/icons-material/Settings'
import SecurityIcon from '@mui/icons-material/Security'
import { Link } from 'react-router-dom'
import AppBar from '~/components/AppBar/AppBar'
import { useAuth } from '~/hooks/useAuth'

function Dashboard() {
  const { user: currentUser } = useAuth()

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
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto 16px',
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
          >
            {currentUser?.displayName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>

          <Typography variant="h5" gutterBottom fontWeight="bold">
            Welcome, {currentUser?.displayName || currentUser?.username || 'User'}!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {currentUser?.email}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Role: <strong>{currentUser?.role || 'client'}</strong>
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/settings/account"
              variant="contained"
              startIcon={<SettingsIcon />}
              sx={{ textTransform: 'none' }}
            >
              Account Settings
            </Button>
            <Button
              component={Link}
              to="/settings/security"
              variant="outlined"
              startIcon={<SecurityIcon />}
              sx={{ textTransform: 'none' }}
            >
              Security
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Dashboard
