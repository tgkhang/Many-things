import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { getSecurityEventsAPI } from '~/apis'

function SecurityEventsTab() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getSecurityEventsAPI()
        setEvents(data || [])
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load security events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const getEventColor = (event) => {
    if (event.includes('FAILED') || event.includes('LOCKED') || event.includes('REUSE')) return 'error'
    if (event.includes('SUCCESS') || event.includes('VERIFIED')) return 'success'
    return 'default'
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
      <Typography variant="h5" sx={{ mb: 3 }}>
        Security Events
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your recent account security activity.
      </Typography>

      {events.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No security events found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={event._id || index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {event.event?.replace(/_/g, ' ') || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={event.success ? <CheckCircleIcon /> : <ErrorIcon />}
                      label={event.success ? 'Success' : 'Failed'}
                      color={event.success ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {event.ipAddress || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={event.userAgent}
                    >
                      {event.userAgent || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.createdAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default SecurityEventsTab
