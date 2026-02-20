# RBAC Implementation Summary

## ✅ Completed Implementation

All three levels of RBAC have been successfully implemented and integrated into the authentication template.

---

## 🎯 Three RBAC Levels Explained

### Level 1: Simple Role-Based

- **File**: `rbacMiddleware-LV1.js`
- **Concept**: User has 1 role → Check if role is in allowed list
- **Usage**: `rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN])`
- **Best For**: Simple apps with 2-3 roles

### Level 2: Permission-Based

- **File**: `rbacMiddleware-LV2.js`
- **Concept**: User has 1 role → Role has permissions → Check permissions
- **Data Source**: `MOCK_ROLES_LV2` constant (instead of database)
- **Usage**: `rbacMiddleware_LV2.isValidPermission([PERMISSIONS.READ_MESSAGE_A])`
- **Best For**: Standard business applications

### Level 3: Role Inheritance

- **File**: `rbacMiddleware-LV3.js`
- **Concept**: User has multiple roles → Roles inherit permissions → Recursive permission collection
- **Data Source**: `MOCK_ROLES_LV3` constant with `inheritRoles` field
- **Usage**: `rbacMiddleware_LV3.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A])`
- **Best For**: Enterprise apps with complex hierarchies

---

## 🧪 Test Endpoints Available

### Utility

- `GET /v1/rbac/me` - Check your current role and all permissions

### Level 1 (3 endpoints)

- `GET /v1/rbac/lv1/admin-only` - Admin only
- `GET /v1/rbac/lv1/admin-moderator` - Admin or moderator
- `GET /v1/rbac/lv1/all-users` - Any authenticated user

### Level 2 (6 endpoints)

- `GET /v1/rbac/lv2/read-message-a` - Requires read-message-a permission
- `POST /v1/rbac/lv2/write-message-a` - Requires write-message-a permission
- `DELETE /v1/rbac/lv2/delete-message-a` - Requires delete-message-a permission
- `GET /v1/rbac/lv2/read-message-b` - Requires read-message-b permission
- `PUT /v1/rbac/lv2/read-write-message-a` - Requires multiple permissions
- `GET /v1/rbac/lv2/manage-users` - Requires manage-users permission

### Level 3 (5 endpoints)

- `GET /v1/rbac/lv3/read-message-a` - With role inheritance
- `POST /v1/rbac/lv3/write-message-a` - With role inheritance
- `DELETE /v1/rbac/lv3/delete-message-a` - With role inheritance
- `GET /v1/rbac/lv3/manage-users` - With role inheritance
- `PUT /v1/rbac/lv3/complex-operation` - Requires 3 permissions (admin only via inheritance)

---

## 📊 Permission Matrix

### LV2 Permissions (Direct Assignment)

| Role      | read-message-a | write-message-a | delete-message-a | manage-users |
| --------- | -------------- | --------------- | ---------------- | ------------ |
| admin     | ✅             | ✅              | ✅               | ✅           |
| moderator | ✅             | ✅              | ❌               | ❌           |
| client    | ❌             | ❌              | ❌               | ❌           |

### LV3 Permissions (With Inheritance)

```
admin (inherits moderator)
  ├─ Own: delete-message-a, delete-message-b, manage-users
  └─ From moderator (inherits client)
      ├─ Own: write-message-a, write-message-b
      └─ From client
          └─ Own: read-message-a, read-message-b

Final admin permissions: ALL 7 permissions
```

---

## 🚀 Quick Start Testing

1. **Start server**:

```bash
npm run dev
```

1. **Login as admin** (or register and login):

```bash
POST http://localhost:8017/v1/users/login
{
  "email": "admin@example.com",
  "password": "Admin123"
}
```

1. **Check your permissions**:

```bash
GET http://localhost:8017/v1/rbac/me
```

1. **Test RBAC endpoints**:

```bash
# Should succeed if you're admin
GET http://localhost:8017/v1/rbac/lv1/admin-only

# Test permission-based
GET http://localhost:8017/v1/rbac/lv2/read-message-a

# Test with inheritance
DELETE http://localhost:8017/v1/rbac/lv3/delete-message-a
```

---

## 💡 How to Use in Your Project

### Example 1: Using LV2 (Recommended for most apps)

```javascript
import { rbacMiddleware_LV2 } from '~/middlewares/rbacMiddleware-LV2'
import { PERMISSIONS } from '~/utils/constants'

Router.delete(
  '/posts/:id',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  postController.delete
)
```

### Example 2: Using LV3 (For complex apps)

```javascript
import { rbacMiddleware_LV3 } from '~/middlewares/rbacMiddleware-LV3'

Router.put(
  '/admin/complex-operation',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([
    PERMISSIONS.READ_MESSAGE_A,
    PERMISSIONS.WRITE_MESSAGE_A,
    PERMISSIONS.DELETE_MESSAGE_A,
  ]),
  adminController.complexOp
)
```

### Example 3: Replace Constants with Database

For production, replace the mock data:

```javascript
// Instead of MOCK_ROLES_LV2
const fullUserRole = await RoleModel.findOne({ name: userRole })

// Instead of MOCK_ROLES_LV3
const role = await RoleModel.findOne({ name: roleName }).populate('inheritRoles')
```

---

## 🔑 Key Features

### All Levels Include

- ✅ Detailed error messages showing missing permissions
- ✅ Proper error handling with try/catch
- ✅ Support for checking multiple permissions at once
- ✅ Compatible with existing JWT authentication
- ✅ Works after `authMiddleware.isAuthorized`
- ✅ Uses constants to avoid typos

### LV2 Specific

- Uses `MOCK_ROLES_LV2` from constants (no DB needed for testing)
- Returns missing permissions in error response
- Shows user's current permissions in error

### LV3 Specific

- Recursive role inheritance (prevents circular inheritance)
- Supports multiple roles per user (array or string)
- Attaches `req.userPermissions` for use in controllers
- Returns computed permissions from all roles
