import { useAuth } from './useAuth'
import { rolePermissions } from '@/config/rbacConfig'

export function usePermission() {
  const { user } = useAuth()

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const userRole = user.role || 'client'
    const permissions = rolePermissions[userRole] || []

    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  const hasRole = (role: string): boolean => {
    if (!user) return false
    return user.role === role
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  }
}
