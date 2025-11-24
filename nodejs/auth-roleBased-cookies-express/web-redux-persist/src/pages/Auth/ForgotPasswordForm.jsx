import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Zoom from '@mui/material/Zoom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { EMAIL_RULE, FIELD_REQUIRED_MESSAGE, EMAIL_RULE_MESSAGE } from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { forgotPasswordAPI } from '~/apis'
import { toast } from 'react-toastify'

function ForgotPasswordForm() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      await forgotPasswordAPI(data.email)
      navigate('/login')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Something went wrong')
    }
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
              Forgot Password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
              }}
            >
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={Link}
                to="/login"
                startIcon={<ArrowBackIcon />}
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
  )
}

export default ForgotPasswordForm
