import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Zoom from '@mui/material/Zoom'
import Alert from '@mui/material/Alert'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  FIELD_REQUIRED_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE,
} from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { useAuth } from '~/hooks/useAuth'
import { toast } from 'react-toastify'

function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  let [searchParams] = useSearchParams()
  const registeredEmail = searchParams.get('registeredEmail')
  const verifiedEmail = searchParams.get('verifiedEmail')

  const onSubmit = async (data) => {
    const { email, password } = data
    toast
      .promise(login(email, password), {
        pending: 'Logging in...',
      })
      .then(() => {
        navigate('/')
      })
      .catch(() => {
        // Error is already handled by axios interceptor
      })
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Zoom in={true} style={{ transitionDelay: '200ms' }}>
      <Card
        sx={{
          minWidth: 380,
          maxWidth: 450,
          width: '100%',
          mx: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              fontWeight="bold"
              sx={{
                color: 'white',
                mb: 1,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              Login
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {registeredEmail && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Registration successful! A verification email has been sent to <strong>{registeredEmail}</strong>.
                Please check your inbox to verify your account.
              </Alert>
            )}

            {verifiedEmail && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Your account has been verified successfully! You can now sign in with your email{' '}
                <strong>{verifiedEmail}</strong>.
              </Alert>
            )}

            <TextField
              fullWidth
              placeholder="Email"
              margin="normal"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(66, 153, 225, 0.5)',
                  },
                },
              }}
              {...register('email', {
                required: FIELD_REQUIRED_MESSAGE,
                pattern: {
                  value: EMAIL_RULE,
                  message: EMAIL_RULE_MESSAGE,
                },
              })}
            />
            <FieldErrorAlert errors={errors} fieldName="email" />

            <TextField
              fullWidth
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="current-password"
              error={!!errors.password}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(66, 153, 225, 0.5)',
                  },
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              {...register('password', {
                required: FIELD_REQUIRED_MESSAGE,
                pattern: {
                  value: PASSWORD_RULE,
                  message: PASSWORD_RULE_MESSAGE,
                },
              })}
            />
            <FieldErrorAlert errors={errors} fieldName="password" />

            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Typography
                component={Link}
                to="/forgot-password"
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  '&:hover': { color: 'white' },
                }}
              >
                Forgot Password?
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                fontWeight: 'bold',
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 15px 0 rgba(30, 60, 114, 0.5)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2a5298 0%, #1e3c72 100%)',
                  boxShadow: '0 6px 20px 0 rgba(30, 60, 114, 0.6)',
                },
              }}
              disabled={isSubmitting}
              className="interceptor-loading"
            >
              {isSubmitting ? 'Signing In...' : 'Sign in'}
            </Button>

            {/* <Divider sx={{ my: 2, color: 'rgba(255, 255, 255, 0.6)' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                or continue with
              </Typography>
            </Divider>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  py: 1.2,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    border: 'none',
                  },
                }}
              >
                <GoogleIcon sx={{ color: '#DB4437' }} />
              </Button>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  py: 1.2,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    border: 'none',
                  },
                }}
              >
                <AppleIcon sx={{ color: '#000000' }} />
              </Button>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  py: 1.2,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    border: 'none',
                  },
                }}
              >
                <FacebookIcon sx={{ color: '#4267B2' }} />
              </Button>
            </Box> */}

            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={Link}
                to="/register"
                fullWidth
                variant="contained"
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px 0 rgba(30, 60, 114, 0.5)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2a5298 0%, #1e3c72 100%)',
                    boxShadow: '0 6px 20px 0 rgba(30, 60, 114, 0.6)',
                  },
                }}
              >
                Signup for free
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default LoginForm
