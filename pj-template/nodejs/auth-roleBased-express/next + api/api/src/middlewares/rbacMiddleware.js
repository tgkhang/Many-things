import { StatusCodes } from 'http-status-codes'
import { MOCK_ROLES } from '~/utils/constants'

const isValidPermission =
  (requiredPermissions = []) =>
  async (req, res, next) => {
    try {
      const userRole = req.jwtDecoded?.role

      if (!userRole) {
        res.status(StatusCodes.FORBIDDEN).json({
          message: 'You do not have permission to access this resource',
          reason: 'No role assigned',
        })
        return
      }

      // Find user's role from mock database
      const fullUserRole = MOCK_ROLES.find((r) => r.name === userRole)

      if (!fullUserRole) {
        res.status(StatusCodes.FORBIDDEN).json({
          message: 'You do not have permission to access this resource',
          reason: 'Role not found',
        })
        return
      }

      // Check if user's role has ALL required permissions
      const userPermissions = fullUserRole.permissions || []
      const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission))

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter((p) => !userPermissions.includes(p))
        res.status(StatusCodes.FORBIDDEN).json({
          message: 'You do not have permission to access this resource',
          reason: 'Missing required permissions',
          required: requiredPermissions,
          missing: missingPermissions,
          yourPermissions: userPermissions,
        })
        return
      }

      next()
    } catch (error) {
      console.error('RBAC Error:', error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  }

export const rbacMiddleware = {
  isValidPermission,
}
