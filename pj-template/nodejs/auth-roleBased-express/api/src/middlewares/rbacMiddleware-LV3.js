import { StatusCodes } from 'http-status-codes'
import { MOCK_ROLES_LV3 } from '~/utils/constants'

/**
 * RBAC Level 3: Role Inheritance with Multiple Roles
 * - A user can have MULTIPLE roles
 * - Roles can inherit permissions from other roles
 * - Recursively collect all permissions from role hierarchy
 *
 * Example hierarchy:
 * - admin inherits from moderator
 * - moderator inherits from client
 * - client has base permissions
 *
 * So admin has: admin permissions + moderator permissions + client permissions
 *
 * Usage: rbacMiddleware_LV3.isValidPermission(['read-message-a', 'write-message-a'])
 */

/**
 * Recursively get all permissions for a role including inherited roles
 * @param {string} roleName - The role name to get permissions for
 * @param {Set} visited - Set to track visited roles (prevent circular inheritance)
 * @returns {Array} - Array of all permissions
 */
const getPermissionsForRole = async (roleName, visited = new Set()) => {
  // Prevent circular inheritance
  if (visited.has(roleName)) {
    return []
  }
  visited.add(roleName)

  // Find the role in mock database
  const role = MOCK_ROLES_LV3.find(r => r.name === roleName)
  if (!role) {
    return []
  }

  // Start with role's own permissions
  const allPermissions = new Set(role.permissions || [])

  // Recursively add permissions from inherited roles
  if (Array.isArray(role.inheritRoles) && role.inheritRoles.length > 0) {
    for (const inheritRoleName of role.inheritRoles) {
      const inheritedPermissions = await getPermissionsForRole(inheritRoleName, visited)
      inheritedPermissions.forEach(permission => allPermissions.add(permission))
    }
  }

  return Array.from(allPermissions)
}

/**
 * Middleware to check if user has required permissions
 * Supports multiple roles and role inheritance
 */
const isValidPermission = (requiredPermissions = []) => async (req, res, next) => {
  try {
    // rbac always work after authMiddleware isAuthorized, so req.jwtDecoded is always available here
    let userRoles = req.jwtDecoded?.role

    // Support both single role (string) and multiple roles (array)
    // In LV3, we expect an array, but handle single role for backward compatibility
    if (!Array.isArray(userRoles)) {
      userRoles = userRoles ? [userRoles] : []
    }

    if (userRoles.length === 0) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You do not have permission to access this resource',
        reason: 'No roles assigned'
      })
      return
    }

    // Collect all permissions from all user roles (including inherited)
    const allUserPermissions = new Set()
    for (const roleName of userRoles) {
      const rolePermissions = await getPermissionsForRole(roleName)
      rolePermissions.forEach(permission => allUserPermissions.add(permission))
    }

    const userPermissionsArray = Array.from(allUserPermissions)

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      allUserPermissions.has(permission)
    )

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(p => !allUserPermissions.has(p))
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You do not have permission to access this resource',
        reason: 'Missing required permissions',
        required: requiredPermissions,
        missing: missingPermissions,
        yourRoles: userRoles,
        yourPermissions: userPermissionsArray
      })
      return
    }

    // Attach computed permissions to request for potential use in controllers
    req.userPermissions = userPermissionsArray

    next()
  } catch (error) {
    console.error('RBAC LV3 Error:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const rbacMiddleware_LV3 = {
  isValidPermission,
  getPermissionsForRole, // Export for testing
}
