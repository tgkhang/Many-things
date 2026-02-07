import express from 'express'
import rateLimit from 'express-rate-limit'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
import { env } from '~/config/environment'
import { PERMISSIONS } from '~/utils/constants'

const Router = express.Router()

// Skip rate limiting in test/dev mode (evaluated dynamically)
const shouldSkipRateLimiting = () => env.BUILD_MODE === 'dev' || process.env.NODE_ENV === 'test'

// Rate limiters for auth routes to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimiting,
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimiting,
})

// Password reset limiter (stricter)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: { message: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimiting,
})

// ============ Public Routes ============

Router.route('/register').post(authLimiter, userValidation.createNew, userController.createNew)

Router.route('/verify_account').put(generalLimiter, userValidation.verifyAccount, userController.verifyAccount)

Router.route('/login').post(authLimiter, userValidation.login, userController.login)

Router.route('/refresh_token').get(generalLimiter, userController.refreshToken)

Router.route('/logout').delete(userController.logout)

// Password reset routes
Router.route('/forgot_password').post(
  passwordResetLimiter,
  userValidation.forgotPassword,
  userController.forgotPassword
)

Router.route('/reset_password').put(passwordResetLimiter, userValidation.resetPassword, userController.resetPassword)

// ============ Protected Routes ============

Router.route('/me').get(authMiddleware.isAuthorized, userController.getMe)

Router.route('/update').put(authMiddleware.isAuthorized, userValidation.update, userController.update)

Router.route('/logout_all_devices').delete(authMiddleware.isAuthorized, userController.logoutAllDevices)

// ============ RBAC Test Routes ============

// Public test route - accessible to all authenticated users
Router.route('/test/read-message').get(
  authMiddleware.isAuthorized,
  rbacMiddleware.isValidPermission([PERMISSIONS.READ_MESSAGE_A]),
  (req, res) => {
    res.json({
      message: 'Success! You have READ permission',
      user: {
        id: req.jwtDecoded.id,
        email: req.jwtDecoded.email,
        role: req.jwtDecoded.role,
      },
      data: {
        messageA: 'This is a secret message A that all users can read',
      },
    })
  }
)

// Write permission required - only admin and operator
Router.route('/test/write-message').post(
  authMiddleware.isAuthorized,
  rbacMiddleware.isValidPermission([PERMISSIONS.WRITE_MESSAGE_A]),
  (req, res) => {
    res.json({
      message: 'Success! You have WRITE permission',
      user: {
        id: req.jwtDecoded.id,
        email: req.jwtDecoded.email,
        role: req.jwtDecoded.role,
      },
      data: {
        created: true,
        messageA: req.body.content || 'New message created',
      },
    })
  }
)

// Delete permission required - only admin
Router.route('/test/delete-message').delete(
  authMiddleware.isAuthorized,
  rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MESSAGE_A]),
  (req, res) => {
    res.json({
      message: 'Success! You have DELETE permission',
      user: {
        id: req.jwtDecoded.id,
        email: req.jwtDecoded.email,
        role: req.jwtDecoded.role,
      },
      data: {
        deleted: true,
        messageId: req.query.id || '123',
      },
    })
  }
)

// Multiple permissions required - read and write
Router.route('/test/update-message').put(
  authMiddleware.isAuthorized,
  rbacMiddleware.isValidPermission([PERMISSIONS.READ_MESSAGE_A, PERMISSIONS.WRITE_MESSAGE_A]),
  (req, res) => {
    res.json({
      message: 'Success! You have both READ and WRITE permissions',
      user: {
        id: req.jwtDecoded.id,
        email: req.jwtDecoded.email,
        role: req.jwtDecoded.role,
      },
      data: {
        updated: true,
        messageA: req.body.content || 'Updated message',
      },
    })
  }
)

export const userRoute = Router
