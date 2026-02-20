# RBAC (Role-Based Access Control) Implementation Guide

This guide explains the three levels of RBAC implementation in this Express.js authentication system.

## Table of Contents

1. [Overview](#overview)
2. [Level 1: Simple Role-Based Access](#level-1-simple-role-based-access)
3. [Level 2: Permission-Based Access](#level-2-permission-based-access)
4. [Level 3: Role Inheritance](#level-3-role-inheritance)
5. [Comparison Table](#comparison-table)
6. [How to Use](#how-to-use)
7. [Testing Guide](#testing-guide)
8. [API Endpoints](#api-endpoints)

---

## Overview

This project implements **three levels** of RBAC, each building upon the previous with increased complexity and flexibility:

- **LV1**: Simple role checking (user has a specific role)
- **LV2**: Permission-based (roles have specific permissions)
- **LV3**: Role inheritance (roles can inherit permissions from other roles)

### Available Roles

```javascript
- admin      // Full access
- moderator  // Limited administrative access
- client     // Basic user access
```

### Available Permissions

```javascript
// Message A permissions
- read-message-a
- write-message-a
- delete-message-a

// Message B permissions
- read-message-b
- write-message-b
- delete-message-b

// User management
- manage-users
```

---

## Level 1: Simple Role-Based Access

### Concept

The simplest RBAC implementation. Users are assigned ONE role, and routes check if the user's role is in the allowed list.

### How It Works

```javascript
// User has role: "admin"
// Route allows: ["admin", "moderator"]
// Result: ✅ Access granted
```

### Implementation

**File**: [src/middlewares/rbacMiddleware-LV1.js](src/middlewares/rbacMiddleware-LV1.js)

```javascript
rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN, USER_ROLES.MODERATOR])
```

### Example Usage

```javascript
Router.get(
  '/admin-only',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN]),
  (req, res) => {
    res.json({ message: 'Welcome, admin!' })
  }
)
```

### Pros & Cons

✅ **Pros:**

- Very simple to understand
- Fast performance
- Easy to implement

❌ **Cons:**

- Limited flexibility
- No permission granularity
- Hard to manage complex access scenarios

---

## Level 2: Permission-Based Access

### Concept

Users have ONE role, but each role has multiple permissions. Routes check for specific permissions rather than roles.

### How It Works

```javascript
// User role: "moderator"
// Moderator permissions: ["read-message-a", "write-message-a", "read-message-b"]
// Route requires: ["read-message-a", "write-message-a"]
// Result: ✅ Access granted (has all required permissions)

// User role: "client"
// Client permissions: ["read-message-b"]
// Route requires: ["write-message-a"]
// Result: ❌ Access denied (missing permission)
```

### Permission Matrix (LV2)

| Role      | read-message-a | write-message-a | delete-message-a | read-message-b | write-message-b | delete-message-b | manage-users |
|-----------|----------------|-----------------|------------------|----------------|-----------------|------------------|--------------|
| admin     | ✅              | ✅               | ✅                | ✅              | ✅               | ✅                | ✅            |
| moderator | ✅              | ✅               | ❌                | ✅              | ❌               | ❌                | ❌            |
| client    | ❌              | ❌               | ❌                | ✅              | ❌               | ❌                | ❌            |

### Implementation

**File**: [src/middlewares/rbacMiddleware-LV2.js](src/middlewares/rbacMiddleware-LV2.js)

**Data Source**: `MOCK_ROLES_LV2` constant in [src/utils/constants.js](src/utils/constants.js:37-53)

```javascript
rbacMiddleware_LV2.isValidPermission(['read-message-a', 'write-message-a'])
```

### Example Usage

```javascript
Router.post(
  '/write-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.WRITE_MESSAGE_A]),
  (req, res) => {
    res.json({ message: 'Message written!' })
  }
)
```

### Pros & Cons

✅ **Pros:**

- Fine-grained access control
- More flexible than LV1
- Permissions are explicit and clear
- Easier to audit access rights

❌ **Cons:**

- Still limited to one role per user
- Permission duplication across roles
- No automatic permission inheritance

---

## Level 3: Role Inheritance

### Concept

Users can have MULTIPLE roles, and roles can inherit permissions from other roles. This creates a permission hierarchy.

### How It Works

```javascript
// Hierarchy:
// admin → inherits from → moderator
// moderator → inherits from → client
// client → base permissions

// User role: ["admin"]
// Admin inherits: moderator + client permissions
// Final permissions: [all admin permissions] + [all moderator permissions] + [all client permissions]
```

### Permission Hierarchy (LV3)

```
┌─────────────────────────────────────────────────┐
│ ADMIN                                           │
│ - delete-message-a, delete-message-b            │
│ - manage-users                                  │
│   ↓ inherits from MODERATOR                     │
│   ├─ write-message-a, write-message-b           │
│   │  ↓ inherits from CLIENT                     │
│   │  └─ read-message-a, read-message-b          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ MODERATOR                                       │
│ - write-message-a, write-message-b              │
│   ↓ inherits from CLIENT                        │
│   └─ read-message-a, read-message-b             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CLIENT                                          │
│ - read-message-a, read-message-b                │
└─────────────────────────────────────────────────┘
```

### Final Permission Matrix (LV3 with Inheritance)

| Role      | read-message-a | write-message-a | delete-message-a | read-message-b | write-message-b | delete-message-b | manage-users |
|-----------|----------------|-----------------|------------------|----------------|-----------------|------------------|--------------|
| admin     | ✅ (inherited)  | ✅ (inherited)   | ✅ (own)          | ✅ (inherited)  | ✅ (inherited)   | ✅ (own)          | ✅ (own)      |
| moderator | ✅ (inherited)  | ✅ (own)         | ❌                | ✅ (inherited)  | ✅ (own)         | ❌                | ❌            |
| client    | ✅ (own)        | ❌               | ❌                | ✅ (own)        | ❌               | ❌                | ❌            |

### Implementation

**File**: [src/middlewares/rbacMiddleware-LV3.js](src/middlewares/rbacMiddleware-LV3.js)

**Data Source**: `MOCK_ROLES_LV3` constant in [src/utils/constants.js](src/utils/constants.js:56-75)

```javascript
rbacMiddleware_LV3.isValidPermission(['read-message-a', 'write-message-a'])
```

### Example Usage

```javascript
Router.delete(
  '/delete-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  (req, res) => {
    res.json({ message: 'Message deleted!', permissions: req.userPermissions })
  }
)
```

### Pros & Cons

✅ **Pros:**

- Most flexible implementation
- Supports multiple roles per user
- Automatic permission inheritance
- Reduces permission duplication
- Easier to scale complex hierarchies
- Real-world organizational structure

❌ **Cons:**

- Most complex to understand
- Slightly slower (recursive permission lookup)
- Potential for circular inheritance (handled in code)
- Requires careful planning of role hierarchy

---

## Comparison Table

| Feature                      | LV1 | LV2 | LV3 |
|------------------------------|-----|-----|-----|
| Multiple roles per user      | ❌  | ❌  | ✅  |
| Permission-based access      | ❌  | ✅  | ✅  |
| Role inheritance             | ❌  | ❌  | ✅  |
| Fine-grained control         | ❌  | ✅  | ✅  |
| Complexity                   | Low | Medium | High |
| Performance                  | Fast | Fast | Moderate |
| Scalability                  | Limited | Good | Excellent |
| Use Case                     | Simple apps | Standard apps | Enterprise apps |

---

## How to Use

### 1. In Your Routes

```javascript
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware_LV1 } from '~/middlewares/rbacMiddleware-LV1'
import { rbacMiddleware_LV2 } from '~/middlewares/rbacMiddleware-LV2'
import { rbacMiddleware_LV3 } from '~/middlewares/rbacMiddleware-LV3'
import { USER_ROLES, PERMISSIONS } from '~/utils/constants'

// LV1: Check role
Router.get(
  '/admin-only',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN]),
  controller
)

// LV2: Check permissions (using constants)
Router.post(
  '/write-message',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.WRITE_MESSAGE_A]),
  controller
)

// LV3: Check permissions with inheritance
Router.delete(
  '/delete-message',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  controller
)
```

### 2. Multiple Permissions

```javascript
// User must have ALL listed permissions
rbacMiddleware_LV2.isValidPermission([
  PERMISSIONS.READ_MESSAGE_A,
  PERMISSIONS.WRITE_MESSAGE_A,
  PERMISSIONS.DELETE_MESSAGE_A
])
```

### 3. In Real Applications

For production use, replace the constants with database queries:

```javascript
// LV2 Example - Replace MOCK_ROLES_LV2
const fullUserRole = await RoleModel.findOne({ name: userRole })

// LV3 Example - Replace MOCK_ROLES_LV3
const role = await RoleModel.findOne({ name: roleName }).populate('inheritRoles')
```

---

## Testing Guide

### Prerequisites

1. Start the server:

```bash
npm run dev
```

1. Register and login to get authentication cookies:

```bash
# Register
POST http://localhost:8017/v1/users/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123",
  "username": "Admin User"
}

# Login
POST http://localhost:8017/v1/users/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123"
}
```

1. The login response will set cookies automatically. Make sure your HTTP client includes cookies in subsequent requests.

### Test Scenarios

#### Check Your Current Role and Permissions

```bash
GET http://localhost:8017/v1/rbac/me
```

**Response:**

```json
{
  "message": "Your current role and permissions",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "admin"
  },
  "permissions": {
    "lv3WithInheritance": [
      "delete-message-a",
      "delete-message-b",
      "manage-users",
      "write-message-a",
      "write-message-b",
      "read-message-a",
      "read-message-b"
    ]
  }
}
```

#### Test as Admin

```bash
# LV1 - Should succeed
GET http://localhost:8017/v1/rbac/lv1/admin-only

# LV2 - Should succeed (admin has all permissions)
DELETE http://localhost:8017/v1/rbac/lv2/delete-message-a

# LV3 - Should succeed (admin inherits all)
PUT http://localhost:8017/v1/rbac/lv3/complex-operation
```

#### Test as Moderator

Change user role to `moderator` in database or JWT token.

```bash
# LV1 - Should succeed
GET http://localhost:8017/v1/rbac/lv1/admin-moderator

# LV2 - Should succeed (moderator has write permission)
POST http://localhost:8017/v1/rbac/lv2/write-message-a

# LV2 - Should FAIL (moderator lacks delete permission)
DELETE http://localhost:8017/v1/rbac/lv2/delete-message-a

# LV3 - Should succeed (moderator inherits read from client)
GET http://localhost:8017/v1/rbac/lv3/read-message-a
```

#### Test as Client

Change user role to `client` in database or JWT token.

```bash
# LV1 - Should succeed
GET http://localhost:8017/v1/rbac/lv1/all-users

# LV2 - Should succeed (client has read-message-b)
GET http://localhost:8017/v1/rbac/lv2/read-message-b

# LV2 - Should FAIL (client lacks read-message-a)
GET http://localhost:8017/v1/rbac/lv2/read-message-a

# LV3 - Should succeed (client has own read permission)
GET http://localhost:8017/v1/rbac/lv3/read-message-a

# LV3 - Should FAIL (client lacks write permission)
POST http://localhost:8017/v1/rbac/lv3/write-message-a
```

### Expected Error Responses

When access is denied:

```json
{
  "message": "You do not have permission to access this resource",
  "reason": "Missing required permissions",
  "required": ["delete-message-a"],
  "missing": ["delete-message-a"],
  "yourPermissions": ["read-message-b"]
}
```

---

## API Endpoints

### Level 1 (LV1)

| Method | Endpoint                    | Allowed Roles                     |
|--------|----------------------------|-----------------------------------|
| GET    | `/rbac/lv1/admin-only`     | admin                             |
| GET    | `/rbac/lv1/admin-moderator`| admin, moderator                  |
| GET    | `/rbac/lv1/all-users`      | admin, moderator, client          |

### Level 2 (LV2)

| Method | Endpoint                        | Required Permissions              | Who Can Access      |
|--------|---------------------------------|-----------------------------------|---------------------|
| GET    | `/rbac/lv2/read-message-a`     | read-message-a                    | admin, moderator    |
| POST   | `/rbac/lv2/write-message-a`    | write-message-a                   | admin, moderator    |
| DELETE | `/rbac/lv2/delete-message-a`   | delete-message-a                  | admin only          |
| GET    | `/rbac/lv2/read-message-b`     | read-message-b                    | admin, moderator, client |
| PUT    | `/rbac/lv2/read-write-message-a` | read-message-a, write-message-a | admin, moderator    |
| GET    | `/rbac/lv2/manage-users`       | manage-users                      | admin only          |

### Level 3 (LV3 with Inheritance)

| Method | Endpoint                        | Required Permissions              | Who Can Access      |
|--------|---------------------------------|-----------------------------------|---------------------|
| GET    | `/rbac/lv3/read-message-a`     | read-message-a                    | admin, moderator, client (all inherit) |
| POST   | `/rbac/lv3/write-message-a`    | write-message-a                   | admin, moderator (inherit from client) |
| DELETE | `/rbac/lv3/delete-message-a`   | delete-message-a                  | admin only          |
| GET    | `/rbac/lv3/manage-users`       | manage-users                      | admin only          |
| PUT    | `/rbac/lv3/complex-operation`  | read, write, delete message-a     | admin only (has all through inheritance) |

### Utility

| Method | Endpoint      | Description                           |
|--------|---------------|---------------------------------------|
| GET    | `/rbac/me`    | Get your current role and permissions |

---

## When to Use Which Level?

### Use LV1 when

- Building a simple application
- Only need 2-3 roles
- Access control is straightforward (admin vs user)
- Performance is critical

### Use LV2 when

- Need fine-grained permission control
- Want to audit specific actions
- Different roles need overlapping permissions
- Building a standard business application

### Use LV3 when

- Building enterprise applications
- Complex organizational hierarchies
- Users wear multiple hats (multiple roles)
- Need flexible permission inheritance
- Want to minimize permission duplication

---

## Tips and Best Practices

1. **Always use constants** for roles and permissions to avoid typos
2. **Use LV2/LV3 with database** in production (not constants)
3. **Test permission inheritance** thoroughly in LV3
4. **Document your permission matrix** for team clarity
5. **Use descriptive permission names** (e.g., `write-message-a` not `perm1`)
6. **Validate permissions** at route level, not in controllers
7. **Cache permission lookups** in production for LV3
8. **Audit permission changes** in production systems

---

## Migration Path

Starting simple and need more control?

```text
LV1 (Simple) → LV2 (Add permissions) → LV3 (Add inheritance)
```

1. Start with LV1 for MVP
2. Migrate to LV2 when you need fine-grained control
3. Migrate to LV3 when role hierarchy becomes complex

Each level is backward compatible in concept - you can run all three simultaneously!

---
