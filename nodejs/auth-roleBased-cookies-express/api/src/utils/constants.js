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
}
