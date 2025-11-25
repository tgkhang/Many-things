# RBAC Implementation Guide - Context/Hooks Based Authentication

This project implements a **3-Level RBAC (Role-Based Access Control)** system using **React Context API and Hooks** for authentication (no Redux).

## 🎯 Quick Start

1. **Login** to the application
2. Click **"RBAC Test"** button on the dashboard
3. Navigate through the **4 tabs** to see your permissions
4. Try accessing protected routes based on your role

---

## 🏗️ Architecture Overview

This implementation uses:
- ✅ **React Context API** for state management (AuthContext)
- ✅ **Custom Hooks** (useAuth, usePermission)
- ✅ **3-Level Guard System** (AuthGuard, RoleGuard, PermissionGuard)
- ✅ **Route Protection** using React Router v6

### Key Difference from Redux Version
- Uses `useAuth()` hook instead of `useSelector()`
- Authentication state managed by AuthContext instead of Redux
- Same RBAC logic and permission system

---

## 🛡️ 3-Level RBAC Guard System

### Level 1: AuthGuard - Basic Authentication
**Purpose:** Check if user is logged in

**Location:** `src/guards/AuthGuard.jsx`

**Usage:**
```jsx
<Route element={<AuthGuard />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**What it checks:**
- ✅ Is user authenticated?
- ✅ Is auth state initialized?

**If not authenticated:**
- Redirects to `/login`

---

### Level 2: RoleGuard - Role-Based Access
**Purpose:** Check if user has required role(s)

**Location:** `src/guards/RoleGuard.jsx`

**Usage:**
```jsx
<Route element={<AuthGuard />}>
  <Route element={<RoleGuard allowedRoles={['admin', 'moderator']} />}>
    <Route path="/analytics" element={<Analytics />} />
  </Route>
</Route>
```

**What it checks:**
- ✅ Is user's role in allowed roles?
- Example: user.role === 'admin' || user.role === 'moderator'

**If not authorized:**
- Shows access denied page OR redirects (if `redirectTo` prop provided)

---

### Level 3: PermissionGuard - Permission-Based Access
**Purpose:** Check if user has specific permission(s) - Most granular control

**Location:** `src/guards/PermissionGuard.jsx`

**Usage:**

**Single Permission:**
```jsx
<Route element={<AuthGuard />}>
  <Route element={<PermissionGuard requiredPermission="manage_users" />}>
    <Route path="/admin" element={<AdminPanel />} />
  </Route>
</Route>
```

**Multiple Permissions (ANY - OR logic):**
```jsx
<Route element={<PermissionGuard
  requiredPermission={["view_audits", "view_analytics"]}
  requireAll={false}
/>}>
  <Route path="/reports" element={<Reports />} />
</Route>
```

**Multiple Permissions (ALL - AND logic):**
```jsx
<Route element={<PermissionGuard
  requiredPermission={["manage_users", "view_audits"]}
  requireAll={true}
/>}>
  <Route path="/super-admin" element={<SuperAdmin />} />
</Route>
```

**What it checks:**
- ✅ Does user have the required permission(s)?
- Checks against `rolePermissions` mapping in `rbacConfig.js`

**If not authorized:**
- Shows access denied page OR redirects

---

## 📋 RBAC Configuration

**File:** `src/config/rbacConfig.js`

### User Roles
```javascript
export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  MODERATOR: 'moderator',
}
```

### Permissions
```javascript
export const permissions = {
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_PROFILE: 'edit_profile',
  VIEW_AUDITS: 'view_audits',
  CHANGE_PASSWORD: 'change_password',
  VIEW_SESSION: 'view_session',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
}
```

### Role-Permission Mapping
```javascript
export const rolePermissions = {
  admin: [/* ALL permissions */],
  moderator: [/* Limited permissions */],
  client: [/* Basic permissions */],
}
```

---

## 👤 Permission Levels by Role

| Permission | Client | Moderator | Admin |
|------------|--------|-----------|-------|
| VIEW_DASHBOARD | ✅ | ✅ | ✅ |
| EDIT_PROFILE | ✅ | ✅ | ✅ |
| CHANGE_PASSWORD | ✅ | ✅ | ✅ |
| VIEW_AUDITS | ❌ | ✅ | ✅ |
| VIEW_SESSION | ❌ | ✅ | ✅ |
| VIEW_ANALYTICS | ❌ | ✅ | ✅ |
| MANAGE_USERS | ❌ | ❌ | ✅ |
| MANAGE_SETTINGS | ❌ | ❌ | ✅ |

---

## 🪝 Custom Hooks

### useAuth Hook
**File:** `src/hooks/useAuth.js`

**Purpose:** Access authentication context

**Usage:**
```jsx
import { useAuth } from '~/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, login, logout, updateUser } = useAuth()

  return <div>Welcome, {user?.displayName}</div>
}
```

**Available Properties:**
- `user` - Current user object
- `isAuthenticated` - Boolean, is user logged in
- `isInitialized` - Boolean, is auth state loaded
- `login(email, password)` - Login function
- `logout()` - Logout function
- `updateUser(data)` - Update user data

---

### usePermission Hook
**File:** `src/hooks/usePermission.js`

**Purpose:** Check if user has specific permissions

**Usage:**
```jsx
import { useAuth } from '~/hooks/useAuth'
import { usePermission } from '~/hooks/usePermission'
import { permissions } from '~/config/rbacConfig'

function MyComponent() {
  const { user } = useAuth()
  const { hasPermission } = usePermission(user?.role)

  if (hasPermission(permissions.MANAGE_USERS)) {
    return <AdminFeature />
  }

  return <RegularFeature />
}
```

---

## 🗂️ File Structure

```
web-authcontext-hook/
├── src/
│   ├── config/
│   │   └── rbacConfig.js              # Permission & role definitions
│   ├── contexts/
│   │   └── AuthContext.jsx            # Authentication context provider
│   ├── guards/
│   │   ├── AuthGuard.jsx              # Level 1: Basic auth
│   │   ├── GuestGuard.jsx             # For login/register pages
│   │   ├── RoleGuard.jsx              # Level 2: Role-based
│   │   └── PermissionGuard.jsx        # Level 3: Permission-based
│   ├── hooks/
│   │   ├── useAuth.js                 # Access auth context
│   │   └── usePermission.js           # Check permissions
│   ├── components/
│   │   └── RBACRoute/
│   │       └── RBACRoute.jsx          # Alternative children pattern
│   ├── pages/
│   │   ├── Dashboard/                 # Home page
│   │   ├── RBACTest/                  # Test page with 4 tabs
│   │   ├── AdminPanel/                # Admin-only page
│   │   ├── Analytics/                 # Moderator+ page
│   │   └── Settings/                  # Permission-protected
│   └── App.jsx                        # Routes with 3-level guards
└── RBAC_IMPLEMENTATION_GUIDE.md       # This file
```

---

## 🚀 Route Examples in App.jsx

### Example 1: Level 1 - Basic Authentication
```jsx
// Any authenticated user can access
<Route element={<AuthGuard />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/rbac-test" element={<RBACTest />} />
</Route>
```

### Example 2: Level 2 - Role-Based Access
```jsx
// Only ADMIN and MODERATOR can access
<Route element={<AuthGuard />}>
  <Route element={<RoleGuard allowedRoles={['admin', 'moderator']} />}>
    <Route path="/analytics-by-role" element={<Analytics />} />
  </Route>
</Route>
```

### Example 3: Level 3 - Permission-Based Access
```jsx
// Only users with MANAGE_USERS permission can access (Admin only)
<Route element={<AuthGuard />}>
  <Route element={<PermissionGuard requiredPermission="manage_users" />}>
    <Route path="/admin" element={<AdminPanel />} />
  </Route>
</Route>
```

### Example 4: Multiple Permissions with OR logic
```jsx
// User needs VIEW_AUDITS OR VIEW_ANALYTICS
<Route element={<AuthGuard />}>
  <Route element={<PermissionGuard
    requiredPermission={["view_audits", "view_analytics"]}
    requireAll={false}
  />}>
    <Route path="/reports" element={<Reports />} />
  </Route>
</Route>
```

### Example 5: Multiple Permissions with AND logic
```jsx
// User needs BOTH permissions
<Route element={<AuthGuard />}>
  <Route element={<PermissionGuard
    requiredPermission={["manage_users", "view_audits"]}
    requireAll={true}
  />}>
    <Route path="/super-admin" element={<SuperAdmin />} />
  </Route>
</Route>
```

---

## 🧪 Testing RBAC

### Test Page
Navigate to `/rbac-test` to see a comprehensive demo with **4 tabs**:

1. **Dashboard & Profile** - Basic permissions (all roles)
2. **Analytics** - Moderator+ permissions
3. **User Management** - Admin-only permissions
4. **Settings** - Admin-only permissions

Each tab displays:
- ✅ **Green "Access Granted"** if you have the permission
- ❌ **Red "Access Denied"** if you don't have the permission

### Routes to Test

| Route | Access Level | Description |
|-------|-------------|-------------|
| `/dashboard` | All authenticated users | Level 1: AuthGuard |
| `/rbac-test` | All authenticated users | Level 1: AuthGuard |
| `/analytics-by-role` | Admin & Moderator | Level 2: RoleGuard |
| `/settings/account` | Has EDIT_PROFILE permission | Level 3: PermissionGuard |
| `/settings/security` | Has CHANGE_PASSWORD permission | Level 3: PermissionGuard |
| `/analytics` | Has VIEW_ANALYTICS permission | Level 3: PermissionGuard |
| `/admin` | Has MANAGE_USERS permission | Level 3: PermissionGuard |
| `/reports` | Has VIEW_AUDITS OR VIEW_ANALYTICS | Level 3: Multiple (OR) |
| `/super-admin` | Has MANAGE_USERS AND VIEW_AUDITS | Level 3: Multiple (AND) |

---

## 🔀 Alternative: RBACRoute Component (Children Pattern)

If you prefer wrapping components directly instead of using nested routes:

**File:** `src/components/RBACRoute/RBACRoute.jsx`

**Usage:**
```jsx
<Route path="/admin" element={
  <RBACRoute requiredPermission="manage_users">
    <AdminPanel />
  </RBACRoute>
} />
```

**When to use:**
- You prefer explicit wrapping over nested routes
- Single routes with unique permissions
- You want to see exactly what protects what

**Note:** Guards (using `<Outlet />`) are preferred for cleaner code when grouping multiple routes.

---

## ⚙️ Guard Component APIs

### AuthGuard
No props required.

```jsx
<Route element={<AuthGuard />}>
  {/* Child routes */}
</Route>
```

### RoleGuard
```jsx
<Route element={<RoleGuard
  allowedRoles={['admin', 'moderator']}  // Array of allowed roles
  redirectTo="/dashboard"                // Optional: redirect instead of access denied
/>}>
  {/* Child routes */}
</Route>
```

### PermissionGuard
```jsx
<Route element={<PermissionGuard
  requiredPermission="manage_users"     // String or array
  requireAll={false}                    // For arrays: true=AND, false=OR
  redirectTo="/dashboard"               // Optional: redirect instead of access denied
/>}>
  {/* Child routes */}
</Route>
```

---

## 🆚 When to Use Each Level

### Use Level 1 (AuthGuard) when:
- You just need to check if user is logged in
- No specific role or permission required
- Example: Dashboard, Profile, RBAC Test

### Use Level 2 (RoleGuard) when:
- Access is based on simple role membership
- You want to allow multiple roles easily
- Example: Analytics page for admins and moderators
- ⚠️ Less flexible than permissions

### Use Level 3 (PermissionGuard) when:
- You need fine-grained access control
- Permissions might change independently of roles
- You want to combine multiple permissions
- Example: Settings pages, Admin panel, Reports
- ✅ **Most flexible and recommended**

---

## 🔧 Adding New Permissions

### Step 1: Add to rbacConfig.js
```javascript
export const permissions = {
  // ... existing
  MY_NEW_PERMISSION: 'my_new_permission',
}
```

### Step 2: Assign to Roles
```javascript
export const rolePermissions = {
  admin: [
    // ... existing
    permissions.MY_NEW_PERMISSION,
  ],
}
```

### Step 3: Protect Route
```jsx
<Route element={<PermissionGuard requiredPermission={permissions.MY_NEW_PERMISSION} />}>
  <Route path="/my-page" element={<MyPage />} />
</Route>
```

---

## 🔐 Security Best Practices

### ⚠️ IMPORTANT: Client-side RBAC is NOT sufficient for security!

**Always:**
- ✅ Validate permissions on the backend/API
- ✅ Implement server-side authorization checks
- ✅ Never trust client-side decisions for security

**Client-side RBAC is for:**
- ✅ User experience (hiding UI users shouldn't see)
- ✅ Reducing unnecessary API calls
- ✅ Providing clear feedback to users

**Never rely on it for:**
- ❌ Actual security enforcement
- ❌ Protecting sensitive data
- ❌ Authorization decisions

---

## 🎨 Customization

### Change Access Denied Page
Edit the JSX in each guard component:
- `src/guards/RoleGuard.jsx`
- `src/guards/PermissionGuard.jsx`
- `src/components/RBACRoute/RBACRoute.jsx`

### Add Loading Spinner
AuthGuard already shows a loading spinner while initializing. Customize it in:
- `src/guards/AuthGuard.jsx`

### Custom Redirect Behavior
Use the `redirectTo` prop:
```jsx
<PermissionGuard
  requiredPermission="manage_users"
  redirectTo="/dashboard"  // Redirect instead of showing access denied
/>
```

---

## 🐛 Troubleshooting

### "Access Denied" even though I should have permission
1. Check your user's role: `console.log(user.role)`
2. Verify permission is assigned in `rbacConfig.js`
3. Check the permission constant matches exactly
4. Ensure AuthContext is providing user data

### Guards not working
1. Ensure AuthProvider wraps your app in `main.jsx`
2. Check AuthGuard is wrapping protected routes
3. Verify imports are correct

### User data not persisting
1. Check localStorage in browser DevTools
2. Verify AuthContext initialization logic
3. Check if logout is clearing state properly

---

## 📚 Comparison: Context vs Redux Version

| Feature | Context Version (this) | Redux Version |
|---------|----------------------|---------------|
| State Management | AuthContext + useState | Redux store |
| User Access | `useAuth()` hook | `useSelector()` |
| Data Persistence | localStorage | redux-persist |
| Complexity | Simpler, less boilerplate | More setup required |
| DevTools | React DevTools | Redux DevTools |
| Best For | Small-medium apps | Large apps, complex state |

**Both versions:**
- ✅ Use same RBAC logic
- ✅ Have same 3-level guard system
- ✅ Use same permission configuration
- ✅ Provide same user experience

---

## ✅ Summary

You now have a complete **3-Level RBAC system** implemented with:

✅ **Level 1:** AuthGuard - Basic authentication
✅ **Level 2:** RoleGuard - Role-based access
✅ **Level 3:** PermissionGuard - Permission-based access

✅ Context API authentication (no Redux)
✅ Custom hooks (useAuth, usePermission)
✅ Interactive test page with 4 tabs
✅ Example protected pages
✅ Comprehensive documentation

**Start testing:** Login → Click "RBAC Test" → Explore the tabs!

---

## 📖 Additional Resources

- React Context API: https://react.dev/reference/react/useContext
- React Router v6: https://reactrouter.com/
- RBAC Concepts: https://en.wikipedia.org/wiki/Role-based_access_control

For the Redux version of this implementation, see the `web-redux-persist` project in the parent directory.
