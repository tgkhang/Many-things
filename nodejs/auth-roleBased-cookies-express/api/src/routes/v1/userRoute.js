import express from 'express'
import rateLimit from 'express-rate-limit'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// Rate limiters for auth routes to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

Router.route('/register').post(authLimiter, userValidation.createNew, userController.createNew)

Router.route('/verify_account').put(generalLimiter, userValidation.verifyAccount, userController.verifyAccount)

Router.route('/login').post(authLimiter, userValidation.login, userController.login)

Router.route('/refresh_token').get(generalLimiter, userController.refreshToken) // get a new token

Router.route('/logout').delete(userController.logout) // can use get or post as well

Router.route('/update').put(
  authMiddleware.isAuthorized,
  userValidation.update,
  userController.update
)

export const userRoute = Router
