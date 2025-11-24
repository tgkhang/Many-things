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
import { FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { resetPasswordAPI } from '~/apis'
import { toast } from 'react-toastify'

function ResetPasswordForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.')
      return
    }

    try {
      await resetPasswordAPI({
        token,
        newPassword: data.newPassword,
      })
      navigate('/login')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reset password')
    }
  }

  if (!token) {
    return (
      <Box
        sx={{
          display: 'flex',
          p: 2,
          flexDirection: 'column',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 25%, #2c5364 50%, #1e3c72 75%, #2a5298 100%)',
        }}
      >
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
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Invalid or missing reset token. Please request a new password reset link.
            </Alert>
            <Button component={Link} to="/forgot-password" variant="contained">
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        p: 2,
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 25%, #2c5364 50%, #1e3c72 75%, #2a5298 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
                Reset Password
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                }}
              >
                Enter your new password below.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                fullWidth
                placeholder="New Password"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                autoComplete="new-password"
                error={!!errors.newPassword}
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
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                {...register('newPassword', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: PASSWORD_RULE,
                    message: PASSWORD_RULE_MESSAGE,
                  },
                })}
              />
              <FieldErrorAlert errors={errors} fieldName="newPassword" />

              <TextField
                fullWidth
                placeholder="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                margin="normal"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
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
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                {...register('confirmPassword', {
                  required: FIELD_REQUIRED_MESSAGE,
                  validate: (value) => {
                    if (value === watch('newPassword')) return true
                    return 'Passwords do not match'
                  },
                })}
              />
              <FieldErrorAlert errors={errors} fieldName="confirmPassword" />

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
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textTransform: 'none',
                    '&:hover': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    </Box>
  )
}

export default ResetPasswordForm
