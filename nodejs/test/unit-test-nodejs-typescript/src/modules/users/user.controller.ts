import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { UserService } from '~/modules/users/user.service'

export const UserController = {
  register: async (req: Request, res: Response) => {
    const { email, username, password } = req.body
    const user = await UserService.register(email, username, password)
    return res.status(StatusCodes.CREATED).json({
      _id: user._id,
      email: user.email,
      username: user.username,
    })
  },

  list: async (_req: Request, res: Response) => {
    const users = await UserService.list()
    res.status(StatusCodes.OK).json(users)
  },
}
