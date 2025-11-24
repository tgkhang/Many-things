import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'

const AUDIT_LOG_COLLECTION_NAME = 'auditLogs'

// Audit event types
export const AUDIT_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL_DEVICES: 'LOGOUT_ALL_DEVICES',

  // Registration events
  REGISTER: 'REGISTER',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',

  // Token events
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',

  // Password events
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',

  // Account events
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
}

const AUDIT_LOG_SCHEMA = Joi.object({
  userId: Joi.string().allow(null).default(null), // null for failed login attempts
  email: Joi.string().email().allow(null).default(null),
  event: Joi.string()
    .valid(...Object.values(AUDIT_EVENTS))
    .required(),
  success: Joi.boolean().required(),
  ipAddress: Joi.string().allow(null).default(null),
  userAgent: Joi.string().allow(null).default(null),
  metadata: Joi.object().default({}), // Additional event-specific data
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
})

const validateBeforeCreate = async (data) => {
  return await AUDIT_LOG_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createLog = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    return await GET_DB().collection(AUDIT_LOG_COLLECTION_NAME).insertOne(validData)
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Audit log error:', error.message)
  }
}

// Helper function to create audit log easily
const log = async (event, { userId = null, email = null, success = true, ipAddress = null, userAgent = null, metadata = {} } = {}) => {
  return await createLog({
    userId: userId?.toString() || null,
    email,
    event,
    success,
    ipAddress,
    userAgent,
    metadata,
  })
}

// Get recent login attempts for an email (for lockout checking)
const getRecentLoginAttempts = async (email, minutes = 15) => {
  try {
    const cutoffTime = Date.now() - minutes * 60 * 1000
    return await GET_DB()
      .collection(AUDIT_LOG_COLLECTION_NAME)
      .find({
        email: email.toLowerCase(),
        event: AUDIT_EVENTS.LOGIN_FAILED,
        createdAt: { $gte: cutoffTime },
      })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

// Get user's recent security events
const getUserSecurityEvents = async (userId, limit = 20) => {
  try {
    return await GET_DB()
      .collection(AUDIT_LOG_COLLECTION_NAME)
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

// Delete old audit logs (retention policy - default 90 days)
const deleteOldLogs = async (days = 90) => {
  try {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
    return await GET_DB()
      .collection(AUDIT_LOG_COLLECTION_NAME)
      .deleteMany({ createdAt: { $lt: cutoffTime } })
  } catch (error) {
    throw new Error(error)
  }
}

export const auditLogModel = {
  AUDIT_LOG_COLLECTION_NAME,
  AUDIT_EVENTS,
  createLog,
  log,
  getRecentLoginAttempts,
  getUserSecurityEvents,
  deleteOldLogs,
}
