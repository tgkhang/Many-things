import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import DevicesIcon from '@mui/icons-material/Devices'
import ComputerIcon from '@mui/icons-material/Computer'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'
import LogoutIcon from '@mui/icons-material/Logout'
import { useConfirm } from 'material-ui-confirm'
import { useDispatch } from 'react-redux'
import { getSessionsAPI, logoutAllDevicesAPI } from '~/apis'
import { logoutUserAPI } from '~/redux/user/userSlice'
import { toast } from 'react-toastify'

function SessionsTab() {
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const [sessions, setSessions] = useState({ count: 0, sessions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const data = await getSessionsAPI()
      setSessions(data || { count: 0, sessions: [] })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <DevicesIcon />
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <PhoneAndroidIcon />
    }
    return <ComputerIcon />
  }

  const getDeviceName = (userAgent) => {
    if (!userAgent) return 'Unknown Device'
    if (userAgent.includes('Windows')) return 'Windows PC'
    if (userAgent.includes('Mac')) return 'Mac'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('Android')) return 'Android'
    return 'Unknown Device'
  }

  const handleLogoutAll = async () => {
    try {
      await confirm({
        title: 'Logout from All Devices',
        description:
          'This will log you out from all devices including this one. You will need to log in again. Are you sure?',
        confirmationText: 'Logout All',
        cancellationText: 'Cancel',
      })

      await logoutAllDevicesAPI()
      dispatch(logoutUserAPI(false))
    } catch (err) {
      if (err !== undefined) {
        toast.error(err?.response?.data?.message || 'Failed to logout from all devices')
      }
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Active Sessions</Typography>
          <Typography variant="body2" color="text.secondary">
            You have {sessions.count} active session(s).
          </Typography>
        </Box>
        {sessions.count > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutAll}
            sx={{ textTransform: 'none' }}
          >
            Logout All Devices
          </Button>
        )}
      </Box>

      {sessions.sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No active sessions found.</Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {sessions.sessions.map((session, index) => (
              <Box key={session._id || index}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>{getDeviceIcon(session.userAgent)}</ListItemIcon>
                  <ListItemText
                    primary={getDeviceName(session.userAgent)}
                    secondary={
                      <Box component="span">
                        <Typography variant="body2" color="text.secondary" component="span">
                          IP: {session.ipAddress || 'Unknown'}
                        </Typography>
                        <br />
                        <Typography variant="body2" color="text.secondary" component="span">
                          Started: {formatDate(session.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  )
}

export default SessionsTab
