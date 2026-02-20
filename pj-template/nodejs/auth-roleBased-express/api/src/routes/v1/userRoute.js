import express from 'express'
import rateLimit from 'express-rate-limit'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { env } from '~/config/environment'

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
Router.route('/forgot_password').post(passwordResetLimiter, userValidation.forgotPassword, userController.forgotPassword)

Router.route('/reset_password').put(passwordResetLimiter, userValidation.resetPassword, userController.resetPassword)

// ============ Protected Routes ============

Router.route('/update').put(authMiddleware.isAuthorized, userValidation.update, userController.update)

Router.route('/logout_all').delete(authMiddleware.isAuthorized, userController.logoutAllDevices)

Router.route('/security_events').get(authMiddleware.isAuthorized, userController.getSecurityEvents)

Router.route('/sessions').get(authMiddleware.isAuthorized, userController.getActiveSessions)

export const userRoute = Router
