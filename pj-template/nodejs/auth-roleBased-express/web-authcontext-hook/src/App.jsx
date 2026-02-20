import NotFound from '~/pages/404/NotFound'
import { Route, Routes, Navigate } from 'react-router-dom'
import Auth from './pages/Auth/Auth'
import AccountVerification from './pages/Auth/AccountVerification'
import ResetPasswordForm from './pages/Auth/ResetPasswordForm'
import Settings from './pages/Settings/Settings'
import Dashboard from './pages/Dashboard/Dashboard'
import RBACTest from './pages/RBACTest/RBACTest'
import AdminPanel from './pages/AdminPanel/AdminPanel'
import Analytics from './pages/Analytics/Analytics'
import AuthGuard from './guards/AuthGuard'
import GuestGuard from './guards/GuestGuard'
import RoleGuard from './guards/RoleGuard'
import PermissionGuard from './guards/PermissionGuard'
import { permissions, USER_ROLES } from './config/rbacConfig'

/**
 * App Component - Demonstrates 3 Levels of RBAC Guards
 *
 * Level 1: AuthGuard - Basic authentication (is user logged in?)
 * Level 2: RoleGuard - Role-based access (is user admin/moderator/client?)
 * Level 3: PermissionGuard - Permission-based access (does user have specific permission?)
 */
function App() {
  return (
    <Routes>
      {/* Redirect route */}
      <Route path="/" element={<Navigate to="/dashboard" replace={true} />} />

      {/* ========================================
          LEVEL 1: AuthGuard - Basic Authentication
          Only checks if user is logged in
          ======================================== */}
      <Route element={<AuthGuard />}>
        {/* Basic protected routes - any authenticated user can access */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rbac-test" element={<RBACTest />} />
      </Route>

      {/* ========================================
          LEVEL 2: RoleGuard - Role-Based Access
          Checks user role (admin, moderator, client)
          ======================================== */}
      {/* Example: Only ADMIN and MODERATOR can access analytics by role */}
      <Route element={<AuthGuard />}>
        <Route element={<RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MODERATOR]} />}>
          <Route path="/analytics-by-role" element={<Analytics />} />
        </Route>
      </Route>

      {/* ========================================
          LEVEL 3: PermissionGuard - Permission-Based Access
          Checks specific permissions (most granular control)
          ======================================== */}
      <Route element={<AuthGuard />}>
        {/* Settings - Requires specific permissions */}
        <Route element={<PermissionGuard requiredPermission={permissions.EDIT_PROFILE} />}>
          <Route path="/settings/account" element={<Settings />} />
        </Route>

        <Route element={<PermissionGuard requiredPermission={permissions.CHANGE_PASSWORD} />}>
          <Route path="/settings/security" element={<Settings />} />
        </Route>

        {/* Analytics - Requires VIEW_ANALYTICS permission */}
        <Route element={<PermissionGuard requiredPermission={permissions.VIEW_ANALYTICS} />}>
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        {/* Admin Panel - Requires MANAGE_USERS permission (Admin only) */}
        <Route element={<PermissionGuard requiredPermission={permissions.MANAGE_USERS} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* Example: Multiple permissions with OR logic (user needs ANY permission) */}
        <Route element={<PermissionGuard requiredPermission={[permissions.VIEW_AUDITS, permissions.VIEW_ANALYTICS]} requireAll={false} />}>
          <Route path="/reports" element={<div>Reports Page (requires VIEW_AUDITS OR VIEW_ANALYTICS)</div>} />
        </Route>

        {/* Example: Multiple permissions with AND logic (user needs ALL permissions) */}
        <Route element={<PermissionGuard requiredPermission={[permissions.MANAGE_USERS, permissions.VIEW_AUDITS]} requireAll={true} />}>
          <Route path="/super-admin" element={<div>Super Admin Page (requires MANAGE_USERS AND VIEW_AUDITS)</div>} />
        </Route>
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
