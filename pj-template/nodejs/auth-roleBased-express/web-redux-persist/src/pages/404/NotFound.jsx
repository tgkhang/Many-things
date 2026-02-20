import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import HomeIcon from '@mui/icons-material/Home'
import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: 120,
            color: 'text.secondary',
            mb: 2
          }}
        />

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3rem', md: '4rem' },
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 1
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 500,
            color: 'text.primary',
            mb: 2
          }}
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            color: 'text.secondary',
            mb: 4,
            maxWidth: 600,
            lineHeight: 1.6
          }}
        >
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
          You might have mistyped the address or the page may have been deleted.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              minWidth: 150
            }}
          >
            Go Home
          </Button>

          <Button
            variant="outlined"
            onClick={handleGoBack}
            sx={{
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              minWidth: 150
            }}
          >
            Go Back
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}

export default NotFound