export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  MODERATOR: 'moderator',
}

export const permissions = {
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_PROFILE: 'edit_profile',
  VIEW_AUDITS: 'view_audits',
  CHANGE_PASSWORD: 'change_password',
  VIEW_SESSION: 'view_session',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
}

export const rolePermissions = {
  [USER_ROLES.ADMIN]: [
    permissions.VIEW_DASHBOARD,
    permissions.EDIT_PROFILE,
    permissions.VIEW_AUDITS,
    permissions.CHANGE_PASSWORD,
    permissions.VIEW_SESSION,
    permissions.MANAGE_USERS,
    permissions.VIEW_ANALYTICS,
    permissions.MANAGE_SETTINGS,
  ],
  [USER_ROLES.MODERATOR]: [
    permissions.VIEW_DASHBOARD,
    permissions.EDIT_PROFILE,
    permissions.VIEW_AUDITS,
    permissions.CHANGE_PASSWORD,
    permissions.VIEW_SESSION,
    permissions.VIEW_ANALYTICS,
  ],
  [USER_ROLES.CLIENT]: [
    permissions.VIEW_DASHBOARD,
    permissions.EDIT_PROFILE,
    permissions.CHANGE_PASSWORD,
  ],
}
