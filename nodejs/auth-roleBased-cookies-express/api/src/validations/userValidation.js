import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from '~/utils/constants'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().email().required().trim().message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
  })

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false, // show all errors at once
    })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().email().required().trim().message(EMAIL_RULE_MESSAGE),
    token: Joi.string().required(),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().email().required().trim().message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    displayName: Joi.string().trim().strict(),
    currentPassword: Joi.string()
      .pattern(PASSWORD_RULE)
      .message('current_password: ' + PASSWORD_RULE_MESSAGE),
    newPassword: Joi.string()
      .pattern(PASSWORD_RULE)
      .message('new_password: ' + PASSWORD_RULE_MESSAGE),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const userValidation = {
  createNew,
  verifyAccount,
  login,
  update,
}
