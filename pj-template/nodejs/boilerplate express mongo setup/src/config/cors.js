import { WHITELIST_DOMAINS } from '~/utils/constants'
import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// CORS Options Configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // console.log('CORS Origin:', origin)
    // Allow api call in dev environment with Postman or similar tools
    // normally when using postman the origin will be undefined
    // if (!origin && env.BUILD_MODE === 'dev') {

    // if origin is undefined in dev mode pass the CORS
    if (env.BUILD_MODE === 'dev') {
      return callback(null, true)
    }

    // Check if the origin is in the whitelist
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // If the domain is not allowed, return an error
    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200,

  // CORS will allow receiving cookies from requests
  credentials: true
}
