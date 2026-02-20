import { StatusCodes } from 'http-status-codes'
import { MOCK_ROLES_LV2 } from '~/utils/constants'

/**
 * RBAC Level 2: Role-based with Permissions
 * - A user has ONE role at a time
 * - Each role has multiple permissions
 * - Check if user's role has the required permissions
 *
 * Example:
 * - admin role has permissions: ['read-message-a', 'write-message-a', 'delete-message-a']
 * - moderator role has permissions: ['read-message-a', 'write-message-a']
 *
 * Usage: rbacMiddleware_LV2.isValidPermission(['read-message-a', 'write-message-a'])
 */
const isValidPermission = (requiredPermissions = []) => async (req, res, next) => {
  try {
    // rbac always work after authMiddleware isAuthorized, so req.jwtDecoded is always available here
    const userRole = req.jwtDecoded?.role

    if (!userRole) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You do not have permission to access this resource',
        reason: 'No role assigned'
      })
      return
    }

    // Find user's role from mock database
    const fullUserRole = MOCK_ROLES_LV2.find(r => r.name === userRole)

    if (!fullUserRole) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You do not have permission to access this resource',
        reason: 'Role not found'
      })
      return
    }

    // Check if user's role has ALL required permissions
    const userPermissions = fullUserRole.permissions || []
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    )

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p))
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You do not have permission to access this resource',
        reason: 'Missing required permissions',
        required: requiredPermissions,
        missing: missingPermissions,
        yourPermissions: userPermissions
      })
      return
    }

    next()
  } catch (error) {
    console.error('RBAC LV2 Error:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const rbacMiddleware_LV2 = {
  isValidPermission,
}
