/* eslint-disable no-unused-vars */
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'

// Example of a simple error-handling middleware in Express.js
// app.use((err, req, res, next) => {
//   console.error(err.stack)
//   res.status(500).send('Something broke!')
// })

// Custom middleware for handling errors globally
export const errorHandlingMiddleware = (err, req, res, next) => {
  // If the developer forgets to set statusCode, default to 500 INTERNAL_SERVER_ERROR
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  // Create a responseError object to control what to return
  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode], //  If the error does not have a message, use the standard ReasonPhrases according to the Status Code
    stack: err.stack // Include stack trace for debugging, for development purpose
  }
  // console.error(responseError)

  // Using cross-env package to set BUILD_MODE variable in npm scripts
  // If the enviroment is DEV, include the stack trace in the response for easier debugging
  if (env.BUILD_MODE !== 'dev') delete responseError.stack

  // Additional handling for logging errors can be done here: note error to log file, send notification to Slack group, Telegram, Email, etc.
  // Or it can be separated into a different Middleware file depending on the project.

  // Send the error response
  res.status(responseError.statusCode).json(responseError)
}
