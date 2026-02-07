export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
} as const

export const permissions = {
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_PROFILE: 'edit_profile',
  VIEW_AUDITS: 'view_audits',
  CHANGE_PASSWORD: 'change_password',
  VIEW_SESSION: 'view_session',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BUSES: 'manage_buses',
  MANAGE_ROUTES: 'manage_routes',
  MANAGE_BOOKINGS: 'manage_bookings',
  VIEW_BOOKINGS: 'view_bookings',
  CREATE_BOOKING: 'create_booking',
} as const

export const rolePermissions: Record<string, string[]> = {
  [USER_ROLES.ADMIN]: [
    permissions.VIEW_DASHBOARD,
    permissions.EDIT_PROFILE,
    permissions.VIEW_AUDITS,
    permissions.CHANGE_PASSWORD,
    permissions.VIEW_SESSION,
    permissions.MANAGE_USERS,
    permissions.VIEW_ANALYTICS,
    permissions.MANAGE_SETTINGS,
    permissions.MANAGE_BUSES,
    permissions.MANAGE_ROUTES,
    permissions.MANAGE_BOOKINGS,
    permissions.VIEW_BOOKINGS,
  ],
  [USER_ROLES.CLIENT]: [
    permissions.VIEW_DASHBOARD,
    permissions.EDIT_PROFILE,
    permissions.CHANGE_PASSWORD,
    permissions.CREATE_BOOKING,
    permissions.VIEW_BOOKINGS,
  ],
}

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type Permission = typeof permissions[keyof typeof permissions]
