import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'

import { UserRepo } from '~/modules/users/user.repo'
import { UserService } from '~/modules/users/user.service'
import { UserRole } from '~/modules/users/user.types'

// mock library bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

jest.mock('~/modules/users/user.repo', () => ({
  UserRepo: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
  },
}))

describe('UserService', () => {
  describe('register()', () => {
    it('should throw error 409 if email already exists', async () => {
      const fakeUserResponse = {
        _id: 'fake-user-id',
        email: 'admin@gmail.com',
        username: 'admin',
      }

      ;(UserRepo.findByEmail as jest.Mock).mockResolvedValue(fakeUserResponse)

      const promise = UserService.register('admin@gmail.com', 'admin', 'password123')

      // promise.catch((err) => {
      //   console.log(err)
      // })
      await expect(promise).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: 'Email already exists',
      })

      expect(UserRepo.findByEmail).toHaveBeenCalledTimes(1)
      expect(UserRepo.findByEmail).toHaveBeenCalledWith('admin@gmail.com')
      expect(bcrypt.hash).not.toHaveBeenCalled()
      expect(UserRepo.create).not.toHaveBeenCalled()
    })

    it('should hash password and create user successfully with ROLE User', async () => {
      ;(UserRepo.findByEmail as jest.Mock).mockResolvedValue(null)
      const hashPassword = 'hashed-password-123'
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashPassword)

      const createdUserResponse = {
        _id: 'new-user-id',
        email: 'admin@gmail.com',
        username: 'admin',
        password_hash: hashPassword,
        role: UserRole.USER,
      }
      ;(UserRepo.create as jest.Mock).mockResolvedValue(createdUserResponse)

      const createUserPayload = {
        email: 'admin@gmail.com',
        username: 'admin',
        password: 'password123',
      }

      const result = await UserService.register(
        createUserPayload.email,
        createUserPayload.username,
        createUserPayload.password
      )

      expect(UserRepo.findByEmail).toHaveBeenCalledTimes(1)
      expect(UserRepo.findByEmail).toHaveBeenCalledWith(createUserPayload.email)

      expect(bcrypt.hash).toHaveBeenCalledTimes(1)
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserPayload.password, 10)

      expect(UserRepo.create).toHaveBeenCalledTimes(1)
      expect(UserRepo.create).toHaveBeenCalledWith({
        email: createUserPayload.email,
        username: createUserPayload.username,
        password_hash: hashPassword,
        role: UserRole.USER,
      })

      expect(result).toEqual(createdUserResponse)
    })
  })

  describe('list()', () => {
    it('should return list of users', async () => {
      const fakeUsers = [
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

      ;(UserRepo.list as jest.Mock).mockResolvedValue(fakeUsers)
      const result = await UserService.list()

      expect(UserRepo.list).toHaveBeenCalledTimes(1)
      expect(result).toEqual(fakeUsers)
    })
  })
})
