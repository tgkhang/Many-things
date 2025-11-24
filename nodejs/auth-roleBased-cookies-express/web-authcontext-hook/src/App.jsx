import NotFound from '~/pages/404/NotFound'
import { Route, Routes, Navigate } from 'react-router-dom'
import Auth from './pages/Auth/Auth'
import AccountVerification from './pages/Auth/AccountVerification'
import ResetPasswordForm from './pages/Auth/ResetPasswordForm'
import Settings from './pages/Settings/Settings'
import Dashboard from './pages/Dashboard/Dashboard'
import AuthGuard from './guards/AuthGuard'
import GuestGuard from './guards/GuestGuard'

function App() {
  return (
    <Routes>
      {/* Redirect route */}
      <Route path="/" element={<Navigate to="/dashboard" replace={true} />} />

      {/* Protected Routes - Require authentication */}
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings/account" element={<Settings />} />
        <Route path="/settings/security" element={<Settings />} />
      </Route>

      {/* Guest Routes - Only for unauthenticated users */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/forgot-password" element={<Auth />} />
      </Route>

      {/* Public Routes - Accessible to everyone */}
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route path="/account/reset-password" element={<ResetPasswordForm />} />
      <Route path="/account/verification" element={<AccountVerification />} />

      {/* 404 Not Found route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
