import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { BrevoEmailProvider } from '~/providers/BrevoEmailProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

const createNew = async (reqBody) => {
  try {
    //1. Check if email already exists (can be written in validation layer or here)
    // có thể coi là 1 bước xử lí logic nên để service
    // validation chỉ xử lí validation gửi lên từ client
    const existingUser = await userModel.findOneByEmail(reqBody.email)
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already in use')
    }

    // create new user with token expiry (24 hours from now)
    const nameFromEmail = reqBody.email.split('@')[0]
    const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 10),
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4(),
      verifyTokenExpiry: Date.now() + VERIFY_TOKEN_EXPIRY_MS,
    }

    // save to db
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // send email verification
    try {
      const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
      const emailSubject = 'Please verify your email'
      const textContent = `Here is your verification link: ${verificationLink}\n\nThank you for registering!`
      const htmlContent = `
        <h3>Here is your verification link:</h3>
        <h3><a href="${verificationLink}">${verificationLink}</a></h3>
        <h3>Thank you for registering!</h3>
      `
      // call provider to send email
      await BrevoEmailProvider.sendEmail(getNewUser.email, emailSubject, textContent, htmlContent)
    } catch (emailError) {
      // console.error('Failed to send verification email:', emailError.message)
      // console.error('Full error details:', emailError.response?.data || emailError)
      // Continue anyway - user is still created successfully
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send verification email')
    }

    // return created user, exclude password and verifyToken
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    const email = reqBody.email.toLowerCase().trim()
    const token = reqBody.token.trim()

    // Find user by email
    const existingUser = await userModel.findOneByEmail(email)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found with this email')
    }

    // Check if account is already verified
    if (existingUser.isActive) {
      throw new ApiError(StatusCodes.CONFLICT, 'Account is already verified')
    }

    // Check if verification token exists (might have been used/expired)
    if (!existingUser.verifyToken) {
      throw new ApiError(StatusCodes.GONE, 'Verification token has already been used or expired')
    }

    // Check if verification token has expired
    if (existingUser.verifyTokenExpiry && Date.now() > existingUser.verifyTokenExpiry) {
      throw new ApiError(StatusCodes.GONE, 'Verification token has expired. Please request a new one.')
    }

    // Verify token matches
    if (existingUser.verifyToken !== token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or incorrect verification token')
    }

    // Update user to active status and remove token
    const updateData = {
      isActive: true,
      verifyToken: null,
      verifyTokenExpiry: null,
      updatedAt: Date.now(),
    }

    const updatedUser = await userModel.update(existingUser._id, updateData)
    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    const existingUser = await userModel.findOneByEmail(reqBody.email)

    // Use generic error message to prevent user enumeration attacks
    const invalidCredentialsError = new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')

    if (!existingUser) {
      throw invalidCredentialsError
    }
    if (!existingUser.isActive) {
      // Still use generic message but could optionally hint about verification
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Account not verified. Please check your email.')
    }

    if (!bcryptjs.compareSync(reqBody.password, existingUser.password)) {
      throw invalidCredentialsError
    }
    // create token information in token will include _id, email, and role
    const userInfo = {
      _id: existingUser._id,
      email: existingUser.email,
      role: existingUser.role,
    }

    // create 2 type of token: access token and refresh token
    const accessToken = await JwtProvider.generateToken(userInfo, env.ACCESS_JWT_SECRET_KEY, env.ACCESS_JWT_EXPIRES_IN)

    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_JWT_SECRET_KEY,
      env.REFRESH_JWT_EXPIRES_IN
    )

    //return token and user info
    return {
      accessToken,
      refreshToken,
      ...pickUser(existingUser),
    }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_JWT_SECRET_KEY)

    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email,
      role: refreshTokenDecoded.role,
    }

    const newAccessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_JWT_SECRET_KEY,
      env.ACCESS_JWT_EXPIRES_IN
    )
    return { accessToken: newAccessToken }
  } catch (error) {
    throw error
  }
}

const update = async (userId, reqBody) => {
  try {
    const existUser = await userModel.findOneById(userId)
    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (!existUser.isActive) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is not active')
    }

    let updatedUser = {}
    // case1 change password
    if (reqBody.currentPassword && reqBody.newPassword) {
      // verify current password
      if (!bcryptjs.compareSync(reqBody.currentPassword, existUser.password)) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect')
      }
      // update to new password
      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.newPassword, 10),
      })
    } else {
      // udpate general info
      updatedUser = await userModel.update(existUser._id, reqBody)
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update,
}
