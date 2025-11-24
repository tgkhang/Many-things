import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

const REFRESH_TOKEN_COLLECTION_NAME = 'refreshTokens'

const REFRESH_TOKEN_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  token: Joi.string().required(),
  familyId: Joi.string().required(), // Token family for rotation detection
  expiresAt: Joi.date().timestamp('javascript').required(),
  isRevoked: Joi.boolean().default(false),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  userAgent: Joi.string().allow(null).optional().default(null),
  ipAddress: Joi.string().allow(null).optional().default(null),
})

const validateBeforeCreate = async (data) => {
  return await REFRESH_TOKEN_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(REFRESH_TOKEN_COLLECTION_NAME).insertOne(validData)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByToken = async (token) => {
  try {
    return await GET_DB().collection(REFRESH_TOKEN_COLLECTION_NAME).findOne({ token })
  } catch (error) {
    throw new Error(error)
  }
}

const findByUserId = async (userId) => {
  try {
    return await GET_DB()
      .collection(REFRESH_TOKEN_COLLECTION_NAME)
      .find({ userId: userId.toString(), isRevoked: false })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

// Revoke a specific token
const revokeToken = async (token) => {
  try {
    return await GET_DB()
      .collection(REFRESH_TOKEN_COLLECTION_NAME)
      .updateOne({ token }, { $set: { isRevoked: true } })
  } catch (error) {
    throw new Error(error)
  }
}

// Revoke all tokens in a family (for rotation breach detection)
const revokeTokenFamily = async (familyId) => {
  try {
    return await GET_DB()
      .collection(REFRESH_TOKEN_COLLECTION_NAME)
      .updateMany({ familyId }, { $set: { isRevoked: true } })
  } catch (error) {
    throw new Error(error)
  }
}

// Revoke all tokens for a user (logout from all devices)
const revokeAllUserTokens = async (userId) => {
  try {
    return await GET_DB()
      .collection(REFRESH_TOKEN_COLLECTION_NAME)
      .updateMany({ userId: userId.toString() }, { $set: { isRevoked: true } })
  } catch (error) {
    throw new Error(error)
  }
}

// Delete expired tokens (cleanup job)
const deleteExpiredTokens = async () => {
  try {
    return await GET_DB()
      .collection(REFRESH_TOKEN_COLLECTION_NAME)
      .deleteMany({ expiresAt: { $lt: Date.now() } })
  } catch (error) {
    throw new Error(error)
  }
}

// Count active sessions for a user
const countActiveSessions = async (userId) => {
  try {
    return await GET_DB()
      .collection(REFRESH_TOKEN_COLLECTION_NAME)
      .countDocuments({
        userId: userId.toString(),
        isRevoked: false,
        expiresAt: { $gt: Date.now() },
      })
  } catch (error) {
    throw new Error(error)
  }
}

export const refreshTokenModel = {
  REFRESH_TOKEN_COLLECTION_NAME,
  createNew,
  findOneByToken,
  findByUserId,
  revokeToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  deleteExpiredTokens,
  countActiveSessions,
}
