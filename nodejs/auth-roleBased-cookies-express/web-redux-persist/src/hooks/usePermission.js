import { rolePermissions } from '~/config/rbacConfig'

export const usePermission = (userRole) => {
  const hasPermission = (permission) => {
    const allowedPermissions = rolePermissions[userRole] || []
    return allowedPermissions.includes(permission)
  }

  return { hasPermission }
}
