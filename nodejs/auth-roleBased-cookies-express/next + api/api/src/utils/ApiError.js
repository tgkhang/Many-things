/**
 * Defined a custom ApiError class that extends the built-in Error class (this is necessary and a best practice since Error is a built-in class)
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    // Call the constructor of the parent class Error to use this (basic OOP knowledge)
    super(message)

    // Adding the name of this custom Error, if not set it will default to "Error"
    this.name = 'ApiError'

    // Assign the HTTP status code here
    this.statusCode = statusCode

    // Record the Stack Trace for easier debugging
    Error.captureStackTrace(this, this.constructor)
  }
}

export default ApiError
