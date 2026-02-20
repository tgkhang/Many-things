import { env } from '~/config/environment'

export const WHITELIST_DOMAINS = ['http://localhost:5173', 'https://bus-booking-frontend.vercel.app']

export const FIELD_REQUIRED_MESSAGE = 'This field is required.'
export const EMAIL_RULE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export const EMAIL_RULE_MESSAGE = 'Please enter a valid email address.'
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include uppercase, lowercase letters, and a number.'

export const LIMIT_COMMON_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_COMMON_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export const WEBSITE_DOMAIN =
  env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12 //need to match frontend constants

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  OPERATOR: 'operator',
}

// Available permissions in the system
export const PERMISSIONS = {
  // Message A permissions
  READ_MESSAGE_A: 'read-message-a',
  WRITE_MESSAGE_A: 'write-message-a',
  DELETE_MESSAGE_A: 'delete-message-a',
}

// Mock Roles with Permissions (RBAC)
export const MOCK_ROLES = [
  {
    name: USER_ROLES.ADMIN,
    permissions: [PERMISSIONS.READ_MESSAGE_A, PERMISSIONS.WRITE_MESSAGE_A, PERMISSIONS.DELETE_MESSAGE_A],
  },
  {
    name: USER_ROLES.OPERATOR,
    permissions: [PERMISSIONS.READ_MESSAGE_A, PERMISSIONS.WRITE_MESSAGE_A],
  },
  {
    name: USER_ROLES.CLIENT,
    permissions: [PERMISSIONS.READ_MESSAGE_A],
  },
]

// Security configuration
export const SECURITY_CONFIG = {
  PASSWORD_RESET_EXPIRY_MINUTES: 30, // 30 minutes for password reset
}
