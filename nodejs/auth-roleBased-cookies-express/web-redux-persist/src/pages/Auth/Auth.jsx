import { Navigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'

function Auth() {
  const location = useLocation()

  const isLogin = location.pathname === '/login' || location.pathname === '/login/'
  const isRegister = location.pathname === '/register' || location.pathname === '/register/'
  const isForgotPassword = location.pathname === '/forgot-password' || location.pathname === '/forgot-password/'

  const currentUser = useSelector(selectCurrentUser)
  if (currentUser) {
    return <Navigate to="/" replace={true} />
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
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66, 153, 225, 0.15) 0%, transparent 70%)',
          top: '-250px',
          right: '-100px',
          filter: 'blur(80px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(49, 130, 206, 0.1) 0%, transparent 70%)',
          bottom: '-300px',
          left: '-150px',
          filter: 'blur(100px)',
        },
      }}
    >
      {isLogin && <LoginForm />}
      {isRegister && <RegisterForm />}
      {isForgotPassword && <ForgotPasswordForm />}
    </Box>
  )
}

export default Auth
