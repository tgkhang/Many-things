import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware_LV1 } from '~/middlewares/rbacMiddleware-LV1'
import { rbacMiddleware_LV2 } from '~/middlewares/rbacMiddleware-LV2'
import { rbacMiddleware_LV3 } from '~/middlewares/rbacMiddleware-LV3'
import { USER_ROLES, PERMISSIONS } from '~/utils/constants'

const Router = express.Router()

// ============================================================================
// LEVEL 1: Simple Role-based Access Control
// ============================================================================

/**
 * Route accessible only by admin
 */
Router.get(
  '/lv1/admin-only',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN]),
  (req, res) => {
    res.status(200).json({
      message: 'Welcome, admin user!',
      level: 'LV1',
      userRole: req.jwtDecoded.role,
    })
  }
)

/**
 * Route accessible by admin and moderator
 */
Router.get(
  '/lv1/admin-moderator',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN, USER_ROLES.MODERATOR]),
  (req, res) => {
    res.status(200).json({
      message: 'Welcome, admin or moderator user!',
      level: 'LV1',
      userRole: req.jwtDecoded.role,
    })
  }
)

/**
 * Route accessible by all authenticated users (any role)
 */
Router.get(
  '/lv1/all-users',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV1.isValidPermission([USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.CLIENT]),
  (req, res) => {
    res.status(200).json({
      message: 'Welcome, authenticated user!',
      level: 'LV1',
      userRole: req.jwtDecoded.role,
    })
  }
)

// ============================================================================
// LEVEL 2: Permission-based Access Control
// ============================================================================

/**
 * Route requiring read permission for message-a
 * admin ✅ moderator ✅ client ❌
 */
Router.get(
  '/lv2/read-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.READ_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can read message A',
      level: 'LV2',
      userRole: req.jwtDecoded.role,
      requiredPermissions: [PERMISSIONS.READ_MESSAGE_A],
      data: { messageA: 'This is a secret message A' }
    })
  }
)

/**
 * Route requiring write permission for message-a
 * admin ✅ moderator ✅ client ❌
 */
Router.post(
  '/lv2/write-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.WRITE_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can write message A',
      level: 'LV2',
      userRole: req.jwtDecoded.role,
      requiredPermissions: [PERMISSIONS.WRITE_MESSAGE_A],
      data: { messageA: 'Message A has been written' }
    })
  }
)

/**
 * Route requiring delete permission for message-a
 * admin ✅ moderator ❌ client ❌
 */
Router.delete(
  '/lv2/delete-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can delete message A',
      level: 'LV2',
      userRole: req.jwtDecoded.role,
      requiredPermissions: [PERMISSIONS.DELETE_MESSAGE_A],
      data: { messageA: 'Message A has been deleted' }
    })
  }
)

/**
 * Route requiring read permission for message-b
 * admin ✅ moderator ✅ client ✅
 */
Router.get(
  '/lv2/read-message-b',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.READ_MESSAGE_B]),
  (req, res) => {
    res.status(200).json({
      message: 'You can read message B',
      level: 'LV2',
      userRole: req.jwtDecoded.role,
      requiredPermissions: [PERMISSIONS.READ_MESSAGE_B],
      data: { messageB: 'This is message B' }
    })
  }
)

/**
 * Route requiring MULTIPLE permissions (read AND write for message-a)
 * admin ✅ moderator ✅ client ❌
 */
Router.put(
  '/lv2/read-write-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.READ_MESSAGE_A, PERMISSIONS.WRITE_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can read and write message A',
      level: 'LV2',
      userRole: req.jwtDecoded.role,
      requiredPermissions: [PERMISSIONS.READ_MESSAGE_A, PERMISSIONS.WRITE_MESSAGE_A],
      data: { messageA: 'Message A has been read and updated' }
    })
  }
)

/**
 * Route requiring user management permission
 * admin ✅ moderator ❌ client ❌
 */
Router.get(
  '/lv2/manage-users',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV2.isValidPermission([PERMISSIONS.MANAGE_USERS]),
  (req, res) => {
    res.status(200).json({
      message: 'You can manage users',
      level: 'LV2',
      userRole: req.jwtDecoded.role,
      requiredPermissions: [PERMISSIONS.MANAGE_USERS],
      data: {
        users: [
          { id: 1, name: 'John Doe', role: 'admin' },
          { id: 2, name: 'Jane Smith', role: 'moderator' },
          { id: 3, name: 'Bob Johnson', role: 'client' }
        ]
      }
    })
  }
)

// ============================================================================
// LEVEL 3: Role Inheritance with Multiple Roles
// ============================================================================

/**
 * Route requiring read permission for message-a
 * With LV3: admin ✅ moderator ✅ client ✅ (all inherit from client who has read permissions)
 */
Router.get(
  '/lv3/read-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([PERMISSIONS.READ_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can read message A (LV3 with inheritance)',
      level: 'LV3',
      userRole: req.jwtDecoded.role,
      userPermissions: req.userPermissions,
      requiredPermissions: [PERMISSIONS.READ_MESSAGE_A],
      data: { messageA: 'This is message A with role inheritance' }
    })
  }
)

/**
 * Route requiring write permission for message-a
 * With LV3: admin ✅ moderator ✅ client ❌
 * (admin/moderator have write, client doesn't)
 */
Router.post(
  '/lv3/write-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([PERMISSIONS.WRITE_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can write message A (LV3 with inheritance)',
      level: 'LV3',
      userRole: req.jwtDecoded.role,
      userPermissions: req.userPermissions,
      requiredPermissions: [PERMISSIONS.WRITE_MESSAGE_A],
      data: { messageA: 'Message A has been written' }
    })
  }
)

/**
 * Route requiring delete permission for message-a
 * With LV3: admin ✅ moderator ❌ client ❌
 * (only admin has delete permission)
 */
Router.delete(
  '/lv3/delete-message-a',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  (req, res) => {
    res.status(200).json({
      message: 'You can delete message A (LV3 with inheritance)',
      level: 'LV3',
      userRole: req.jwtDecoded.role,
      userPermissions: req.userPermissions,
      requiredPermissions: [PERMISSIONS.DELETE_MESSAGE_A],
      data: { messageA: 'Message A has been deleted' }
    })
  }
)

/**
 * Route requiring user management permission
 * With LV3: admin ✅ moderator ❌ client ❌
 */
Router.get(
  '/lv3/manage-users',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([PERMISSIONS.MANAGE_USERS]),
  (req, res) => {
    res.status(200).json({
      message: 'You can manage users (LV3 with inheritance)',
      level: 'LV3',
      userRole: req.jwtDecoded.role,
      userPermissions: req.userPermissions,
      requiredPermissions: [PERMISSIONS.MANAGE_USERS],
      data: {
        users: [
          { id: 1, name: 'John Doe', role: ['admin'] },
          { id: 2, name: 'Jane Smith', role: ['moderator'] },
          { id: 3, name: 'Bob Johnson', role: ['client'] }
        ]
      }
    })
  }
)

/**
 * Route requiring MULTIPLE complex permissions
 * With LV3: admin ✅ (has all through inheritance)
 */
Router.put(
  '/lv3/complex-operation',
  authMiddleware.isAuthorized,
  rbacMiddleware_LV3.isValidPermission([
    PERMISSIONS.READ_MESSAGE_A,
    PERMISSIONS.WRITE_MESSAGE_A,
    PERMISSIONS.DELETE_MESSAGE_A
  ]),
  (req, res) => {
    res.status(200).json({
      message: 'You can perform complex operations (LV3 with inheritance)',
      level: 'LV3',
      userRole: req.jwtDecoded.role,
      userPermissions: req.userPermissions,
      requiredPermissions: [
        PERMISSIONS.READ_MESSAGE_A,
        PERMISSIONS.WRITE_MESSAGE_A,
        PERMISSIONS.DELETE_MESSAGE_A
      ],
      data: { result: 'Complex operation completed successfully' }
    })
  }
)

// ============================================================================
// Utility Routes for Testing
// ============================================================================

/**
 * Get current user's role and permissions (for testing)
 */
Router.get(
  '/me',
  authMiddleware.isAuthorized,
  async (req, res) => {
    const { rbacMiddleware_LV3: lv3 } = await import('~/middlewares/rbacMiddleware-LV3')

    let userRoles = req.jwtDecoded?.role
    if (!Array.isArray(userRoles)) {
      userRoles = userRoles ? [userRoles] : []
    }

    // Get all permissions for LV3
    const lv3Permissions = new Set()
    for (const roleName of userRoles) {
      const rolePermissions = await lv3.getPermissionsForRole(roleName)
      rolePermissions.forEach(permission => lv3Permissions.add(permission))
    }

    res.status(200).json({
      message: 'Your current role and permissions',
      user: {
        id: req.jwtDecoded._id,
        email: req.jwtDecoded.email,
        role: req.jwtDecoded.role,
      },
      permissions: {
        lv3WithInheritance: Array.from(lv3Permissions)
      }
    })
  }
)

export const rbacRoute = Router
