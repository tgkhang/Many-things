import { env } from '~/config/environment'

export const WHITELIST_DOMAINS = ['http://localhost:5173']

export const FIELD_REQUIRED_MESSAGE = 'This field is required.'
export const EMAIL_RULE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export const EMAIL_RULE_MESSAGE = 'Please enter a valid email address.'
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include uppercase, lowercase letters, and a number.'

export const WEBSITE_DOMAIN =
  env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  MODERATOR: 'moderator',
}

// Security configurations
export const SECURITY_CONFIG = {
  // Account lockout settings
  MAX_LOGIN_ATTEMPTS: 5, // Lock after 5 failed attempts
  LOCKOUT_DURATION_MINUTES: 15, // Lock for 15 minutes

  // Password reset settings
  PASSWORD_RESET_EXPIRY_MINUTES: 60, // 1 hour

  // Token settings
  REFRESH_TOKEN_EXPIRY_DAYS: 14,
  MAX_SESSIONS_PER_USER: 5, // Maximum concurrent sessions
}

// MOCK DB for roles and permissions (LV2: Role-based with permissions)
export const MOCK_ROLES_LV2 = [
  {
    _id: 'role1',
    name: 'admin',
    permissions: ['read-message-a', 'write-message-a', 'delete-message-a', 'read-message-b', 'write-message-b', 'delete-message-b', 'manage-users'],
  },
  {
    _id: 'role2',
    name: 'moderator',
    permissions: ['read-message-a', 'write-message-a', 'read-message-b'],
  },
  {
    _id: 'role3',
    name: 'client',
    permissions: ['read-message-b'],
  }
]

// MOCK DB for roles with inheritance (LV3: Role inheritance)
export const MOCK_ROLES_LV3 = [
  {
    _id: 'role1',
    name: 'admin',
    permissions: ['delete-message-a', 'delete-message-b', 'manage-users'],
    inheritRoles: ['moderator'], // Admin inherits all moderator permissions
  },
  {
    _id: 'role2',
    name: 'moderator',
    permissions: ['write-message-a', 'write-message-b'],
    inheritRoles: ['client'], // Moderator inherits all client permissions
  },
  {
    _id: 'role3',
    name: 'client',
    permissions: ['read-message-a', 'read-message-b'],
    inheritRoles: [],
  }
]

// Available permissions in the system
export const PERMISSIONS = {
  // Message A permissions
  READ_MESSAGE_A: 'read-message-a',
  WRITE_MESSAGE_A: 'write-message-a',
  DELETE_MESSAGE_A: 'delete-message-a',

  // Message B permissions
  READ_MESSAGE_B: 'read-message-b',
  WRITE_MESSAGE_B: 'write-message-b',
  DELETE_MESSAGE_B: 'delete-message-b',

  // User management
  MANAGE_USERS: 'manage-users',
}
