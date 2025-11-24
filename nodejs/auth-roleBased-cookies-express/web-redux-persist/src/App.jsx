import NotFound from '~/pages/404/NotFound'
import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import Auth from './pages/Auth/Auth'
import AccountVerification from './pages/Auth/AccountVerification'
import ResetPasswordForm from './pages/Auth/ResetPasswordForm'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from './redux/user/userSlice'
import Settings from './pages/Settings/Settings'
import Dashboard from './pages/Dashboard/Dashboard'

const ProtectedRoute = ({ user }) => {
  if (!user) return <Navigate to="/login" replace={true} />
  return <Outlet />
}

function App() {
  const currentUser = useSelector(selectCurrentUser)

  return (
    <Routes>
      {/* Redirect route */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace={true}
          />
        }
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute user={currentUser} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings/account" element={<Settings />} />
        <Route path="/settings/security" element={<Settings />} />
      </Route>

      {/* Authentication Routes */}
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/forgot-password" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route path="/account/reset-password" element={<ResetPasswordForm />} />
      <Route path="/account/verification" element={<AccountVerification />} />

      {/* 404 Not Found route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
