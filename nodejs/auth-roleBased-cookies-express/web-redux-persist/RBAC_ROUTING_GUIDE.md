# RBAC Routing Guide

This project implements Role-Based Access Control (RBAC) for routing in two different patterns. Both approaches provide the same functionality but use different React Router v6 patterns.

## Quick Start

To see RBAC in action:

1. Login to the application
2. Click the "RBAC Test" button on the dashboard
3. Navigate through the tabs to see which permissions your role has

## Two Implementation Patterns

### Pattern 1: Children Pattern (App.jsx)

Uses wrapper components that receive `children` props.

### Pattern 2: Outlet Pattern (App2.jsx)

Uses nested routes with `<Outlet />` component.

---

## Pattern 1: Children Pattern (App.jsx)

### Components

- **RBACRoute.jsx** - Uses `{children}` prop to wrap protected components

### How It Works

Routes wrap components directly using the `element` prop:

```jsx
<Route
  path="/admin"
  element={
    <ProtectedRoute user={currentUser}>
      <RBACRoute requiredPermission={permissions.MANAGE_USERS}>
        <AdminPanel />
      </RBACRoute>
    </ProtectedRoute>
  }
/>
```

### Pros

- ✅ Explicit and easy to understand
- ✅ Clear hierarchy - you can see exactly what wraps what
- ✅ Flexible - easy to add multiple wrapper layers
- ✅ Good for single routes with specific permissions

### Cons

- ❌ Can become verbose with many routes
- ❌ Repetitive code when multiple routes need same protection
- ❌ Each route must be wrapped individually

### Use Cases

- Single routes with unique permission requirements
- When you need multiple layers of protection/validation
- When route structure is simple and not deeply nested

---

## Pattern 2: Outlet Pattern (App2.jsx)

### Components

- **RBACRouteOutlet.jsx** - Uses `<Outlet />` to render nested routes

### How It Works

Routes are organized hierarchically with parent routes rendering `<Outlet />`:

```jsx
<Route element={<RBACRouteOutlet requiredPermission={permissions.MANAGE_USERS} />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>
```

### Pros

- ✅ Cleaner for grouping multiple routes with same permission
- ✅ Less repetitive code
- ✅ Better for complex route hierarchies
- ✅ More idiomatic React Router v6

### Cons

- ❌ Slightly less obvious what's protecting what
- ❌ Requires understanding of `<Outlet />` concept

### Use Cases

- Multiple routes sharing the same permission requirements
- Complex nested route structures
- When you want cleaner, more maintainable route definitions

---

## RBAC Configuration

All permissions are defined in `src/config/rbacConfig.js`:

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

export const rolePermissions = {
  admin: [
    /* all permissions */
  ],
  moderator: [
    /* limited permissions */
  ],
  client: [
    /* basic permissions */
  ],
}
```

---

## Available Roles and Permissions

### Admin Role

- ✅ All permissions
- Can access: Dashboard, Settings, Admin Panel, Analytics, RBAC Test

### Moderator Role

- ✅ VIEW_DASHBOARD
- ✅ EDIT_PROFILE
- ✅ VIEW_AUDITS
- ✅ CHANGE_PASSWORD
- ✅ VIEW_SESSION
- ✅ VIEW_ANALYTICS
- Can access: Dashboard, Settings, Analytics, RBAC Test
- Cannot access: Admin Panel

### Client Role

- ✅ VIEW_DASHBOARD
- ✅ EDIT_PROFILE
- ✅ CHANGE_PASSWORD
- Can access: Dashboard, Basic Settings, RBAC Test
- Cannot access: Admin Panel, Analytics, Security Events

---

## Component APIs

### RBACRoute (Children Pattern)

```jsx
<RBACRoute
  requiredPermission="manage_users" // Single permission (string)
  requiredPermission={['perm1', 'perm2']} // Multiple permissions (array)
  requireAll={false} // true = ALL permissions required, false = ANY (default: false)
  redirectTo="/dashboard" // Optional: redirect instead of showing access denied
>
  <YourComponent />
</RBACRoute>
```

### RBACRouteOutlet (Outlet Pattern)

```jsx
<Route element={<RBACRouteOutlet requiredPermission="manage_users" requireAll={false} redirectTo="/dashboard" />}>
  <Route path="/child" element={<ChildComponent />} />
</Route>
```

---

## Examples

### Example 1: Single Permission Required

```jsx
// Children Pattern
<Route path="/admin" element={
  <ProtectedRoute user={currentUser}>
    <RBACRoute requiredPermission={permissions.MANAGE_USERS}>
      <AdminPanel />
    </RBACRoute>
  </ProtectedRoute>
} />

// Outlet Pattern
<Route element={<ProtectedRoute user={currentUser} />}>
  <Route element={<RBACRouteOutlet requiredPermission={permissions.MANAGE_USERS} />}>
    <Route path="/admin" element={<AdminPanel />} />
  </Route>
</Route>
```

### Example 2: Multiple Routes, Same Permission

```jsx
// Children Pattern - Repetitive
<Route path="/reports/users" element={
  <ProtectedRoute user={currentUser}>
    <RBACRoute requiredPermission={permissions.VIEW_ANALYTICS}>
      <UserReport />
    </RBACRoute>
  </ProtectedRoute>
} />
<Route path="/reports/system" element={
  <ProtectedRoute user={currentUser}>
    <RBACRoute requiredPermission={permissions.VIEW_ANALYTICS}>
      <SystemReport />
    </RBACRoute>
  </ProtectedRoute>
} />

// Outlet Pattern - Cleaner
<Route element={<ProtectedRoute user={currentUser} />}>
  <Route element={<RBACRouteOutlet requiredPermission={permissions.VIEW_ANALYTICS} />}>
    <Route path="/reports/users" element={<UserReport />} />
    <Route path="/reports/system" element={<SystemReport />} />
  </Route>
</Route>
```

### Example 3: Multiple Permissions (ANY)

```jsx
// User needs VIEW_AUDITS OR VIEW_ANALYTICS
<RBACRoute requiredPermission={[permissions.VIEW_AUDITS, permissions.VIEW_ANALYTICS]} requireAll={false}>
  <Reports />
</RBACRoute>
```

### Example 4: Multiple Permissions (ALL)

```jsx
// User needs BOTH permissions
<RBACRoute requiredPermission={[permissions.MANAGE_USERS, permissions.VIEW_AUDITS]} requireAll={true}>
  <SuperAdminPanel />
</RBACRoute>
```

---

## Testing RBAC

### Test Page

Navigate to `/rbac-test` to see a comprehensive demo with 4 tabs:

1. **Dashboard & Profile** - Basic permissions
2. **Analytics** - Moderator+ permissions
3. **User Management** - Admin-only permissions
4. **Settings** - Admin-only permissions

Each tab shows whether you have access based on your current role.

### Protected Routes to Test

- `/dashboard` - All authenticated users
- `/rbac-test` - All authenticated users
- `/settings/account` - Requires EDIT_PROFILE permission
- `/settings/security` - Requires CHANGE_PASSWORD permission
- `/analytics` - Requires VIEW_ANALYTICS permission (Admin & Moderator)
- `/admin` - Requires MANAGE_USERS permission (Admin only)

---

## Which Pattern Should You Use?

### Use Children Pattern (App.jsx) when:

- You have routes with unique permission requirements
- You need explicit, clear wrapper hierarchy
- Your route structure is relatively flat
- You prefer verbose but obvious code

### Use Outlet Pattern (App2.jsx) when:

- You have multiple routes sharing same permissions
- You're building complex nested route structures
- You want more maintainable, DRY code
- You're comfortable with React Router v6 concepts

**Recommendation**: For most applications, the **Outlet Pattern** is preferred for its cleaner structure and better maintainability, especially as your application grows.

---

## Switching Between Patterns

To switch between implementations:

1. Open `src/main.jsx` (or `src/index.jsx`)
2. Change the import:

   ```jsx
   // For Children Pattern
   import App from './App'

   // For Outlet Pattern
   import App from './App2'
   ```

Both implementations provide identical functionality!

---

## Custom Permission Hook

Use the `usePermission` hook in your components:

```jsx
import { usePermission } from '~/hooks/usePermission'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'

function MyComponent() {
  const currentUser = useSelector(selectCurrentUser)
  const { hasPermission } = usePermission(currentUser?.role)

  if (hasPermission('manage_users')) {
    return <AdminFeature />
  }

  return <RegularFeature />
}
```

---

## Adding New Permissions

1. Add to `src/config/rbacConfig.js`:

   ```javascript
   export const permissions = {
     // ... existing permissions
     MY_NEW_PERMISSION: 'my_new_permission',
   }
   ```

2. Assign to roles:

   ```javascript
   export const rolePermissions = {
     admin: [
       // ... existing permissions
       permissions.MY_NEW_PERMISSION,
     ],
   }
   ```

3. Use in routes:
   ```jsx
   <RBACRoute requiredPermission={permissions.MY_NEW_PERMISSION}>
     <MyProtectedComponent />
   </RBACRoute>
   ```

---

## File Structure

```
src/
├── components/
│   └── RBACRoute/
│       ├── RBACRoute.jsx          # Children pattern component
│       └── RBACRouteOutlet.jsx    # Outlet pattern component
├── config/
│   └── rbacConfig.js              # Permission definitions
├── hooks/
│   └── usePermission.js           # Permission check hook
├── pages/
│   ├── Dashboard/
│   ├── RBACTest/                  # Test page with tabs
│   ├── AdminPanel/                # Admin-only page
│   ├── Analytics/                 # Moderator+ page
│   └── Settings/
├── App.jsx                        # Children pattern routes
└── App2.jsx                       # Outlet pattern routes
```
