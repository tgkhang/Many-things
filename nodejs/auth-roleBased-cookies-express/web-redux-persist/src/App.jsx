import NotFound from '~/pages/404/NotFound'
import { Route, Routes, Navigate } from 'react-router-dom'
import Auth from './pages/Auth/Auth'
import AccountVerification from './pages/Auth/AccountVerification'
import ResetPasswordForm from './pages/Auth/ResetPasswordForm'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from './redux/user/userSlice'
import Settings from './pages/Settings/Settings'
import Dashboard from './pages/Dashboard/Dashboard'
import RBACTest from './pages/RBACTest/RBACTest'
import AdminPanel from './pages/AdminPanel/AdminPanel'
import Analytics from './pages/Analytics/Analytics'
import RBACRoute from './components/RBACRoute/RBACRoute'
import { permissions } from './config/rbacConfig'

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace={true} />
  return <>{children}</>
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

      {/* Protected Routes - Basic authentication check */}
      <Route path="/dashboard" element={
        <ProtectedRoute user={currentUser}>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* RBAC Protected Routes - Requires specific permissions */}
      <Route path="/rbac-test" element={
        <ProtectedRoute user={currentUser}>
          <RBACTest />
        </ProtectedRoute>
      } />

      {/* Settings routes with RBAC - Requires EDIT_PROFILE permission */}
      <Route path="/settings/account" element={
        <ProtectedRoute user={currentUser}>
          <RBACRoute requiredPermission={permissions.EDIT_PROFILE}>
            <Settings />
          </RBACRoute>
        </ProtectedRoute>
      } />

      <Route path="/settings/security" element={
        <ProtectedRoute user={currentUser}>
          <RBACRoute requiredPermission={permissions.CHANGE_PASSWORD}>
            <Settings />
          </RBACRoute>
        </ProtectedRoute>
      } />

      {/* Admin Panel - Only for users with MANAGE_USERS permission (Admin only) */}
      <Route path="/admin" element={
        <ProtectedRoute user={currentUser}>
          <RBACRoute requiredPermission={permissions.MANAGE_USERS}>
            <AdminPanel />
          </RBACRoute>
        </ProtectedRoute>
      } />

      {/* Analytics - For users with VIEW_ANALYTICS permission (Admin & Moderator) */}
      <Route path="/analytics" element={
        <ProtectedRoute user={currentUser}>
          <RBACRoute requiredPermission={permissions.VIEW_ANALYTICS}>
            <Analytics />
          </RBACRoute>
        </ProtectedRoute>
      } />

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
