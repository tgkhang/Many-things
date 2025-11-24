import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import { refreshTokenModel } from '~/models/refreshTokenModel'
import { auditLogModel, AUDIT_EVENTS } from '~/models/auditLogModel'
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

const createNew = async (reqBody, req = null) => {
  try {
    const clientInfo = getClientInfo(req)

    const existingUser = await userModel.findOneByEmail(reqBody.email)
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already in use')
    }

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

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Audit log
    await auditLogModel.log(AUDIT_EVENTS.REGISTER, {
      userId: getNewUser._id,
      email: getNewUser.email,
      success: true,
      ...clientInfo,
    })

    // Send verification email
    try {
      const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
      const emailSubject = 'Please verify your email'
      const textContent = `Here is your verification link: ${verificationLink}\n\nThank you for registering!`
      const htmlContent = `
        <h3>Here is your verification link:</h3>
        <h3><a href="${verificationLink}">${verificationLink}</a></h3>
        <h3>Thank you for registering!</h3>
      `
      await BrevoEmailProvider.sendEmail(getNewUser.email, emailSubject, textContent, htmlContent)
    } catch (emailError) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send verification email')
    }

    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody, req = null) => {
  try {
    const clientInfo = getClientInfo(req)
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

    if (existingUser.verifyTokenExpiry && Date.now() > existingUser.verifyTokenExpiry) {
      throw new ApiError(StatusCodes.GONE, 'Verification token has expired. Please request a new one.')
    }

    if (existingUser.verifyToken !== token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or incorrect verification token')
    }

    const updateData = {
      isActive: true,
      verifyToken: null,
      verifyTokenExpiry: null,
      updatedAt: Date.now(),
    }

    const updatedUser = await userModel.update(existingUser._id, updateData)

    // Audit log
    await auditLogModel.log(AUDIT_EVENTS.EMAIL_VERIFIED, {
      userId: existingUser._id,
      email: existingUser.email,
      success: true,
      ...clientInfo,
    })

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody, req = null) => {
  try {
    const clientInfo = getClientInfo(req)
    const email = reqBody.email.toLowerCase().trim()

    const existingUser = await userModel.findOneByEmail(email)
    const invalidCredentialsError = new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')

    if (!existingUser) {
      // Log failed attempt even for non-existent users
      await auditLogModel.log(AUDIT_EVENTS.LOGIN_FAILED, {
        email,
        success: false,
        ...clientInfo,
        metadata: { reason: 'User not found' },
      })
      throw invalidCredentialsError
    }

    // Check if account is locked
    if (existingUser.lockoutUntil && Date.now() < existingUser.lockoutUntil) {
      const remainingMinutes = Math.ceil((existingUser.lockoutUntil - Date.now()) / 60000)
      await auditLogModel.log(AUDIT_EVENTS.LOGIN_FAILED, {
        userId: existingUser._id,
        email,
        success: false,
        ...clientInfo,
        metadata: { reason: 'Account locked' },
      })
      throw new ApiError(
        StatusCodes.TOO_MANY_REQUESTS,
        `Account is locked. Please try again in ${remainingMinutes} minute(s).`
      )
    }

    if (!existingUser.isActive) {
      await auditLogModel.log(AUDIT_EVENTS.LOGIN_FAILED, {
        userId: existingUser._id,
        email,
        success: false,
        ...clientInfo,
        metadata: { reason: 'Account not verified' },
      })
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Account not verified. Please check your email.')
    }

    // Verify password
    if (!bcryptjs.compareSync(reqBody.password, existingUser.password)) {
      // Increment failed attempts
      const newFailedAttempts = (existingUser.failedLoginAttempts || 0) + 1
      const updateData = { failedLoginAttempts: newFailedAttempts }

      // Lock account if max attempts reached
      if (newFailedAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        updateData.lockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000
        await auditLogModel.log(AUDIT_EVENTS.ACCOUNT_LOCKED, {
          userId: existingUser._id,
          email,
          success: true,
          ...clientInfo,
          metadata: { lockoutMinutes: SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES },
        })
      }

      await userModel.update(existingUser._id, updateData)

      await auditLogModel.log(AUDIT_EVENTS.LOGIN_FAILED, {
        userId: existingUser._id,
        email,
        success: false,
        ...clientInfo,
        metadata: { attemptNumber: newFailedAttempts },
      })

      throw invalidCredentialsError
    }

    // Successful login - reset failed attempts
    await userModel.update(existingUser._id, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    })

    // Create tokens
    const userInfo = {
      _id: existingUser._id,
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
    await refreshTokenModel.createNew({
      userId: existingUser._id.toString(),
      token: refreshToken,
      familyId,
      expiresAt: Date.now() + refreshTokenExpiryMs,
      ...clientInfo,
    })

    // Audit log
    await auditLogModel.log(AUDIT_EVENTS.LOGIN_SUCCESS, {
      userId: existingUser._id,
      email,
      success: true,
      ...clientInfo,
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

const refreshToken = async (clientRefreshToken, req = null) => {
  try {
    const clientInfo = getClientInfo(req)

    if (!clientRefreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is required')
    }

    // Verify JWT
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_JWT_SECRET_KEY)

    // Check if token exists in DB and is not revoked
    const storedToken = await refreshTokenModel.findOneByToken(clientRefreshToken)

    if (!storedToken) {
      // Token not found - might be a replay attack
      await auditLogModel.log(AUDIT_EVENTS.TOKEN_REFRESH_FAILED, {
        email: refreshTokenDecoded.email,
        success: false,
        ...clientInfo,
        metadata: { reason: 'Token not found in database' },
      })
      throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid refresh token')
    }

    if (storedToken.isRevoked) {
      // Token was revoked - possible token theft, revoke entire family
      await refreshTokenModel.revokeTokenFamily(storedToken.familyId)
      await auditLogModel.log(AUDIT_EVENTS.TOKEN_REUSE_DETECTED, {
        userId: storedToken.userId,
        email: refreshTokenDecoded.email,
        success: false,
        ...clientInfo,
        metadata: { familyId: storedToken.familyId },
      })
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
      _id: refreshTokenDecoded._id,
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
    await refreshTokenModel.createNew({
      userId: storedToken.userId,
      token: newRefreshToken,
      familyId: storedToken.familyId, // Keep same family for rotation tracking
      expiresAt: Date.now() + refreshTokenExpiryMs,
      ...clientInfo,
    })

    await auditLogModel.log(AUDIT_EVENTS.TOKEN_REFRESH, {
      userId: storedToken.userId,
      email: refreshTokenDecoded.email,
      success: true,
      ...clientInfo,
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  } catch (error) {
    throw error
  }
}

const logout = async (clientRefreshToken, req = null) => {
  try {
    const clientInfo = getClientInfo(req)

    if (clientRefreshToken) {
      const storedToken = await refreshTokenModel.findOneByToken(clientRefreshToken)
      if (storedToken) {
        await refreshTokenModel.revokeToken(clientRefreshToken)
        await auditLogModel.log(AUDIT_EVENTS.LOGOUT, {
          userId: storedToken.userId,
          success: true,
          ...clientInfo,
        })
      }
    }

    return { loggedOut: true }
  } catch (error) {
    throw error
  }
}

const logoutAllDevices = async (userId, req = null) => {
  try {
    const clientInfo = getClientInfo(req)

    await refreshTokenModel.revokeAllUserTokens(userId)

    await auditLogModel.log(AUDIT_EVENTS.LOGOUT_ALL_DEVICES, {
      userId: userId.toString(),
      success: true,
      ...clientInfo,
    })

    return { loggedOutAll: true }
  } catch (error) {
    throw error
  }
}

const forgotPassword = async (reqBody, req = null) => {
  try {
    const clientInfo = getClientInfo(req)
    const email = reqBody.email.toLowerCase().trim()

    const existingUser = await userModel.findOneByEmail(email)

    // Always return success to prevent email enumeration
    if (!existingUser) {
      return { message: 'If an account exists with this email, a password reset link has been sent.' }
    }

    // Generate reset token
    const resetToken = uuidv4()
    const resetExpiry = Date.now() + SECURITY_CONFIG.PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000

    await userModel.update(existingUser._id, {
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

    await auditLogModel.log(AUDIT_EVENTS.PASSWORD_RESET_REQUESTED, {
      userId: existingUser._id,
      email,
      success: true,
      ...clientInfo,
    })

    return { message: 'If an account exists with this email, a password reset link has been sent.' }
  } catch (error) {
    throw error
  }
}

const resetPassword = async (reqBody, req = null) => {
  try {
    const clientInfo = getClientInfo(req)
    const { token, newPassword } = reqBody

    const existingUser = await userModel.findByPasswordResetToken(token)

    if (!existingUser) {
      await auditLogModel.log(AUDIT_EVENTS.PASSWORD_RESET_FAILED, {
        success: false,
        ...clientInfo,
        metadata: { reason: 'Invalid token' },
      })
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired reset token')
    }

    if (Date.now() > existingUser.passwordResetExpiry) {
      await auditLogModel.log(AUDIT_EVENTS.PASSWORD_RESET_FAILED, {
        userId: existingUser._id,
        email: existingUser.email,
        success: false,
        ...clientInfo,
        metadata: { reason: 'Token expired' },
      })
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Reset token has expired. Please request a new one.')
    }

    // Update password and clear reset token
    await userModel.update(existingUser._id, {
      password: bcryptjs.hashSync(newPassword, 10),
      passwordResetToken: null,
      passwordResetExpiry: null,
      updatedAt: Date.now(),
    })

    // Revoke all existing sessions for security
    await refreshTokenModel.revokeAllUserTokens(existingUser._id)

    await auditLogModel.log(AUDIT_EVENTS.PASSWORD_RESET_SUCCESS, {
      userId: existingUser._id,
      email: existingUser.email,
      success: true,
      ...clientInfo,
    })

    return { message: 'Password has been reset successfully. Please login with your new password.' }
  } catch (error) {
    throw error
  }
}

const update = async (userId, reqBody, req = null) => {
  try {
    const clientInfo = getClientInfo(req)

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

      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.newPassword, 10),
        updatedAt: Date.now(),
      })

      // Revoke all sessions except current for security
      await refreshTokenModel.revokeAllUserTokens(existUser._id)

      await auditLogModel.log(AUDIT_EVENTS.PASSWORD_CHANGED, {
        userId: existUser._id,
        email: existUser.email,
        success: true,
        ...clientInfo,
      })
    } else {
      // Update general info
      updatedUser = await userModel.update(existUser._id, {
        ...reqBody,
        updatedAt: Date.now(),
      })

      await auditLogModel.log(AUDIT_EVENTS.PROFILE_UPDATED, {
        userId: existUser._id,
        email: existUser.email,
        success: true,
        ...clientInfo,
        metadata: { fields: Object.keys(reqBody) },
      })
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const getSecurityEvents = async (userId) => {
  try {
    return await auditLogModel.getUserSecurityEvents(userId)
  } catch (error) {
    throw error
  }
}

const getActiveSessions = async (userId) => {
  try {
    const count = await refreshTokenModel.countActiveSessions(userId)
    const sessions = await refreshTokenModel.findByUserId(userId)
    return {
      count,
      sessions: sessions.map((s) => ({
        createdAt: s.createdAt,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
      })),
    }
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
  getSecurityEvents,
  getActiveSessions,
}
