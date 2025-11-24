import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) {
    next(error)
  }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    // send cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true, // fe will not be able to access the cookie via client-side JS
      secure: true,
      sameSite: 'none', // allow cross-site cookie
      maxAge: ms('7d'), // 7 days
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // fe will not be able to access the cookie via client-side JS
      secure: true,
      sameSite: 'none', // allow cross-site cookie
      maxAge: ms('7d'), // 7 days
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)
    res.cookie('accessToken', result.accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: ms('7d') })
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Could not refresh access token, please login again'))
  }
}

const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'none' })
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' })
    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    // decoded in authMiddleware
    const userId = req.jwtDecoded._id
    // console.log('userAvatarFile:', userAvatarFile)
    const updatedUser = await userService.update(userId, req.body)
    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  logout,
  update,
}
