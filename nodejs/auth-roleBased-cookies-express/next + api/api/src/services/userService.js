import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import { refreshTokenModel } from '~/models/refreshTokenModel'
import ApiError from '~/utils/ApiError'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN, SECURITY_CONFIG } from '~/utils/constants'
import { BrevoEmailProvider } from '~/providers/BrevoEmailProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ms from 'ms'

// Helper to get client info from request
const getClientInfo = (req) => ({
  ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
  userAgent: req?.headers?.['user-agent'] || null,
})

const createNew = async (reqBody) => {
  try {
    const existingUser = await userModel.findOneByEmail(reqBody.email)
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already in use')
    }

    const nameFromEmail = reqBody.email.split('@')[0]
    const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 10),
      username: reqBody.username,
      displayName: nameFromEmail,
      verifyToken: uuidv4(),
      verifyTokenExpiry: new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS),
    }

    const createdUser = await userModel.createNew(newUser)

    // Send verification email
    try {
      const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${createdUser.email}&token=${createdUser.verifyToken}`
      const emailSubject = 'Please verify your email'
      const textContent = `Here is your verification link: ${verificationLink}\n\nThank you for registering!`
      const htmlContent = `
        <h3>Here is your verification link:</h3>
        <h3><a href="${verificationLink}">${verificationLink}</a></h3>
        <h3>Thank you for registering!</h3>
      `
      await BrevoEmailProvider.sendEmail(createdUser.email, emailSubject, textContent, htmlContent)
      // eslint-disable-next-line no-unused-vars
    } catch (emailError) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send verification email')
    }
    return pickUser(createdUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    const email = reqBody.email.toLowerCase().trim()
    const token = reqBody.token.trim()

    const existingUser = await userModel.findOneByEmail(email)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found with this email')
    }

    if (existingUser.isActive) {
      throw new ApiError(StatusCodes.CONFLICT, 'Account is already verified')
    }

    if (!existingUser.verifyToken) {
      throw new ApiError(StatusCodes.GONE, 'Verification token has already been used or expired')
    }

    if (existingUser.verifyTokenExpiry && new Date() > new Date(existingUser.verifyTokenExpiry)) {
      throw new ApiError(StatusCodes.GONE, 'Verification token has expired. Please request a new one.')
    }

    if (existingUser.verifyToken !== token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or incorrect verification token')
    }

    const updateData = {
      isActive: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    }

    const updatedUser = await userModel.update(existingUser.id, updateData)

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody, req) => {
  try {
    const email = reqBody.email.toLowerCase().trim()

    const existingUser = await userModel.findOneByEmail(email)
    const invalidCredentialsError = new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')

    // Verify password
    if (!bcryptjs.compareSync(reqBody.password, existingUser.password)) {
      throw invalidCredentialsError
    }

    // Create tokens
    const userInfo = {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    }

    const accessToken = await JwtProvider.generateToken(userInfo, env.ACCESS_JWT_SECRET_KEY, env.ACCESS_JWT_EXPIRES_IN)
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_JWT_SECRET_KEY,
      env.REFRESH_JWT_EXPIRES_IN
    )

    // Store refresh token in DB with family ID for rotation
    const familyId = uuidv4()
    const refreshTokenExpiryMs = ms(env.REFRESH_JWT_EXPIRES_IN || '14d')
    const clientInfo = getClientInfo(req)
    await refreshTokenModel.createNew({
      userId: existingUser.id,
      token: refreshToken,
      familyId,
      expiresAt: Date.now() + refreshTokenExpiryMs,
      userAgent: clientInfo.userAgent,
      ipAddress: clientInfo.ipAddress,
    })

    return {
      accessToken,
      refreshToken,
      ...pickUser(existingUser),
    }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken, req) => {
  try {
    if (!clientRefreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is required')
    }

    // Verify JWT
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_JWT_SECRET_KEY)

    // Check if token exists in DB and is not revoked
    const storedToken = await refreshTokenModel.findOneByToken(clientRefreshToken)

    if (!storedToken) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid refresh token')
    }

    if (storedToken.isRevoked) {
      // Token was revoked - possible token theft, revoke entire family
      await refreshTokenModel.revokeTokenFamily(storedToken.familyId)
      throw new ApiError(StatusCodes.FORBIDDEN, 'Token has been revoked. Please login again.')
    }

    if (Date.now() > storedToken.expiresAt) {
      await refreshTokenModel.revokeToken(clientRefreshToken)
      throw new ApiError(StatusCodes.FORBIDDEN, 'Refresh token has expired')
    }

    // Revoke old token (rotation)
    await refreshTokenModel.revokeToken(clientRefreshToken)

    // Generate new tokens
    const userInfo = {
      id: refreshTokenDecoded.id,
      email: refreshTokenDecoded.email,
      role: refreshTokenDecoded.role,
    }

    const newAccessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_JWT_SECRET_KEY,
      env.ACCESS_JWT_EXPIRES_IN
    )

    const newRefreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_JWT_SECRET_KEY,
      env.REFRESH_JWT_EXPIRES_IN
    )

    // Store new refresh token with same family ID
    const refreshTokenExpiryMs = ms(env.REFRESH_JWT_EXPIRES_IN || '14d')
    const clientInfo = getClientInfo(req)
    await refreshTokenModel.createNew({
      userId: storedToken.userId,
      token: newRefreshToken,
      familyId: storedToken.familyId, // Keep same family for rotation tracking
      expiresAt: Date.now() + refreshTokenExpiryMs,
      userAgent: clientInfo.userAgent,
      ipAddress: clientInfo.ipAddress,
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  } catch (error) {
    throw error
  }
}

const logout = async (clientRefreshToken) => {
  try {
    if (clientRefreshToken) {
      const storedToken = await refreshTokenModel.findOneByToken(clientRefreshToken)
      if (storedToken) {
        await refreshTokenModel.revokeToken(clientRefreshToken)
      }
    }

    return { loggedOut: true }
  } catch (error) {
    throw error
  }
}

const logoutAllDevices = async (userId) => {
  try {
    await refreshTokenModel.revokeAllUserTokens(userId)
    return { message: 'All devices have been logged out successfully' }
  } catch (error) {
    throw error
  }
}

const forgotPassword = async (reqBody) => {
  try {
    const email = reqBody.email.toLowerCase().trim()

    const existingUser = await userModel.findOneByEmail(email)

    // Always return success to prevent email enumeration
    if (!existingUser) {
      return { message: 'If an account exists with this email, a password reset link has been sent.' }
    }

    // Generate reset token
    const resetToken = uuidv4()
    const resetExpiry = new Date(Date.now() + SECURITY_CONFIG.PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000)

    await userModel.update(existingUser.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    })

    // Send reset email
    try {
      const resetLink = `${WEBSITE_DOMAIN}/account/reset-password?token=${resetToken}`
      const emailSubject = 'Password Reset Request'
      const textContent = `You requested a password reset. Click here to reset: ${resetLink}\n\nThis link expires in ${SECURITY_CONFIG.PASSWORD_RESET_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, please ignore this email.`
      const htmlContent = `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link expires in ${SECURITY_CONFIG.PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p>
        <p><small>If you didn't request this, please ignore this email.</small></p>
      `
      await BrevoEmailProvider.sendEmail(email, emailSubject, textContent, htmlContent)
    } catch (emailError) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send password reset email')
    }

    return { message: 'If an account exists with this email, a password reset link has been sent.' }
  } catch (error) {
    throw error
  }
}

const resetPassword = async (reqBody) => {
  try {
    const { token, newPassword } = reqBody

    const existingUser = await userModel.findByPasswordResetToken(token)

    if (!existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired reset token')
    }

    if (new Date() > new Date(existingUser.passwordResetExpiry)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Reset token has expired. Please request a new one.')
    }

    // Update password and clear reset token
    await userModel.update(existingUser.id, {
      password: bcryptjs.hashSync(newPassword, 10),
      passwordResetToken: null,
      passwordResetExpiry: null,
    })

    // Revoke all existing sessions for security
    await refreshTokenModel.revokeAllUserTokens(existingUser.id)

    return { message: 'Password has been reset successfully. Please login with your new password.' }
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

    // Case: change password
    if (reqBody.currentPassword && reqBody.newPassword) {
      if (!bcryptjs.compareSync(reqBody.currentPassword, existUser.password)) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect')
      }

      updatedUser = await userModel.update(existUser.id, {
        password: bcryptjs.hashSync(reqBody.newPassword, 10),
      })

      // Revoke all sessions except current for security
      await refreshTokenModel.revokeAllUserTokens(existUser.id)
    } else {
      // Update general info
      updatedUser = await userModel.update(existUser.id, {
        ...reqBody,
      })
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const getMe = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return pickUser(user)
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  update,
  getMe,
}
