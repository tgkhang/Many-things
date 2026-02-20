import { StatusCodes } from 'http-status-codes'

// a user can only have one role at a time
// allowedRoles is an array of roles that can access the resource
const isValidPermission = (allowedRoles) => async (req, res, next) => {
  try {
    // rbac always work after authMiddleware isAuthorized, so req.jwtDecoded is always available here
    const userRole = req.jwtDecoded.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(StatusCodes.FORBIDDEN).json({ message: 'You do not have permission to access this resource' })
      return
    }
    next()
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' })
  }
}

export const rbacMiddleware_LV1 = {
  isValidPermission,
}
