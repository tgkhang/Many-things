/* eslint-disable no-unused-vars */
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'

// Custom middleware for handling errors globally
export const errorHandlingMiddleware = (err, req, res, next) => {
  // If the developer forgets to set statusCode, default to 500 INTERNAL_SERVER_ERROR
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  // Create a responseError object to control what to return
  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode],
    stack: err.stack,
  }

  if (env.BUILD_MODE !== 'dev') delete responseError.stack

  res.status(responseError.statusCode).json(responseError)
}
