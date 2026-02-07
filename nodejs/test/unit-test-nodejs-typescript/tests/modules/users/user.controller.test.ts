import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { UserController } from '~/modules/users/user.controller'
import { UserService } from '~/modules/users/user.service'

// mock user service\
jest.mock('~/modules/users/user.service', () => ({
  UserService: {
    register: jest.fn(),
    list: jest.fn(),
  },
}))

describe('UserController', () => {
  //create function mock return a express js response
  const mockResponse = () => {
    const res = {} as Response
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    return res
  }

  describe('register()', () => {
    it('should call UserService.register and return 201 with user data', async () => {
      const req = {
        body: {
          email: 'admin@gmail.com',
          username: 'admin',
          password: 'password123',
        },
      } as unknown as Request

      const res = mockResponse()

      const fakeUserResponse = {
        _id: 'userId123',
        email: 'admin@gmail.com',
        username: 'admin',
      }

      // defensive semicolon
      ;(UserService.register as jest.Mock).mockResolvedValue(fakeUserResponse)

      await UserController.register(req, res)

      // userservice.register call with correct params
      expect(UserService.register).toHaveBeenCalledWith(req.body.email, req.body.username, req.body.password)

      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)

      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
  })

  describe('list()', () => {
    it('should return list of users with 200 status', async () => {
      const req = {} as Request
      const res = mockResponse()

      const fakeUserResponse = [
        {
          _id: 'userId123',
          email: 'admin@gmail.com',
          username: 'admin',
        },
        {
          _id: 'userId456',
          email: 'abc@gmail.com',
          username: 'abc',
        },
      ]

      ;(UserService.list as jest.Mock).mockResolvedValue(fakeUserResponse)

      await UserController.list(req, res)

      expect(UserService.list).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
  })
})
