import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE_MESSAGE, USER_ROLES } from '~/utils/constants'

const USER_COLLECTION_NAME = 'users'

const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().email().required().trim().lowercase().message(EMAIL_RULE_MESSAGE),
  password: Joi.string().required(),
  username: Joi.string().min(3).max(30).trim().strict(),
  displayName: Joi.string().optional().min(3).max(50).trim().strict(),
  avatar: Joi.string().optional().uri().default(null),
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .default(USER_ROLES.CLIENT),

  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),
  verifyTokenExpiry: Joi.date().timestamp('javascript').default(null),

  // Password reset fields
  passwordResetToken: Joi.string().default(null),
  passwordResetExpiry: Joi.date().timestamp('javascript').default(null),

  // Account lockout fields
  failedLoginAttempts: Joi.number().default(0),
  lockoutUntil: Joi.date().timestamp('javascript').default(null),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

const INVALID_UPDATE_FIELDS = ['_id', 'email', 'createdAt', 'username']

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (userId) => {
  try {
    const res = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(userId) })
    return res
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByEmail = async (email) => {
  try {
    const res = await GET_DB().collection(USER_COLLECTION_NAME).findOne({ email: email.toLowerCase() })
    return res
  } catch (error) {
    throw new Error(error)
  }
}

const findByPasswordResetToken = async (token) => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ passwordResetToken: token })
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    Object.keys(updateData).forEach((key) => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete updateData[key]
      }
    })

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: updateData }, { returnDocument: 'after' })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  USER_ROLES,
  createNew,
  findOneById,
  findOneByEmail,
  findByPasswordResetToken,
  update,
}
