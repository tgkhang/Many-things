import NotFound from '~/pages/404/NotFound'
import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
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
import RBACRouteOutlet from './components/RBACRoute/RBACRouteOutlet'
import { permissions } from './config/rbacConfig'

/**
 * ProtectedRoute using Outlet pattern
 * This component renders an <Outlet /> which will display the nested child routes
 */
const ProtectedRoute = ({ user }) => {
  if (!user) return <Navigate to="/login" replace={true} />
  return <Outlet />
}

/**
 * App2 Component - Using Outlet Pattern for Nested Routes
 *
 * This version demonstrates how to use React Router v6's nested routes pattern
 * with the <Outlet /> component. Routes are organized hierarchically and the
 * parent route renders an <Outlet /> that displays child routes.
 *
 * Key differences from App.jsx (children pattern):
 * 1. Uses <Outlet /> instead of wrapping components with {children}
 * 2. Routes are nested using parent-child relationship
 * 3. Cleaner route structure for grouping related routes
 * 4. Parent route components render <Outlet /> to show child content
 *
 * Example structure:
 * <Route element={<ParentWithOutlet />}>
 *   <Route path="/child1" element={<Child1 />} />
 *   <Route path="/child2" element={<Child2 />} />
 * </Route>
 */
function App2() {
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

      {/* Protected Routes - Using Outlet pattern */}
      <Route element={<ProtectedRoute user={currentUser} />}>

        {/* Basic protected routes - no specific permission required */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rbac-test" element={<RBACTest />} />

        {/* Settings routes with RBAC - Using nested Outlet pattern */}
        <Route element={<RBACRouteOutlet requiredPermission={permissions.EDIT_PROFILE} />}>
          <Route path="/settings/account" element={<Settings />} />
        </Route>

        <Route element={<RBACRouteOutlet requiredPermission={permissions.CHANGE_PASSWORD} />}>
          <Route path="/settings/security" element={<Settings />} />
        </Route>

        {/* Admin Panel - Only for users with MANAGE_USERS permission */}
        <Route element={<RBACRouteOutlet requiredPermission={permissions.MANAGE_USERS} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* Analytics - For users with VIEW_ANALYTICS permission */}
        <Route element={<RBACRouteOutlet requiredPermission={permissions.VIEW_ANALYTICS} />}>
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        {/* You can also group multiple routes under one permission check */}
        <Route element={<RBACRouteOutlet requiredPermission={[permissions.VIEW_AUDITS, permissions.VIEW_ANALYTICS]} requireAll={false} />}>
          {/* These nested routes will all require VIEW_AUDITS OR VIEW_ANALYTICS permission */}
          <Route path="/reports/user-activity" element={<div>User Activity Report (requires VIEW_AUDITS or VIEW_ANALYTICS)</div>} />
          <Route path="/reports/system-health" element={<div>System Health Report (requires VIEW_AUDITS or VIEW_ANALYTICS)</div>} />
        </Route>

      </Route>

      {/* Authentication Routes - Public routes */}
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

export default App2
