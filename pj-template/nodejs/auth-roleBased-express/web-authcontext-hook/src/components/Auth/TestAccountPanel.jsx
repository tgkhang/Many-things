import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import IconButton from '@mui/material/IconButton'
import { toast } from 'react-toastify'

function TestAccountPanel() {
  const testEmail = 'tgkhang22@clc.fitus.edu.vn'
  const testPassword = 'Demo@1234'

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard!`)
  }

  return (
    <Box
      sx={{
        mt: 4,
        minWidth: 320,
        maxWidth: 400,
        width: '90%',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        p: 2.5,
        zIndex: 1,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          color: 'white',
          fontWeight: 'bold',
          mb: 1.5,
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        Test Account
      </Typography>

      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'block',
            mb: 0.5,
          }}
        >
          Email
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            px: 1.5,
            py: 0.8,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'white',
              flex: 1,
              fontSize: '0.85rem',
              wordBreak: 'break-all',
            }}
          >
            {testEmail}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleCopy(testEmail, 'Email')}
            sx={{
              color: 'white',
              ml: 1,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'block',
            mb: 0.5,
          }}
        >
          Password
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            px: 1.5,
            py: 0.8,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'white',
              flex: 1,
              fontSize: '0.85rem',
            }}
          >
            {testPassword}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleCopy(testPassword, 'Password')}
            sx={{
              color: 'white',
              ml: 1,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default TestAccountPanel
