// This file is a middleware to validate jsonwebtoken from cookie sending from client request
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import ApiError from '~/utils/ApiError'

const isAuthorized = async (req, _res, next) => {
  const clientAccessToken = req.cookies?.accessToken
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized, no access token provided'))
    return
  }

  try {
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_JWT_SECRET_KEY)
    // Map _id to id for compatibility
    req.jwtDecoded = {
      ...accessTokenDecoded,
      id: accessTokenDecoded.id || accessTokenDecoded._id,
    }

    next()
  } catch (error) {
    if (error?.message?.includes('expired')) {
      next(new ApiError(StatusCodes.GONE, 'Your access token is expired, please refresh token'))
      return
    }
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized, invalid access token'))
  }
}

export const authMiddleware = {
  isAuthorized,
}
