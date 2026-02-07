import { bcrypt } from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'

import { UserRepo } from '~/modules/users/user.repo'
import { UserService } from '~/modules/users/user.service'
import { UserRole } from '~/modules/users/user.types'

// mock library bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

jest.mock('~/modules/users/user.repo',()=>({
  UserRepo:{
    findByEmail: jest.fn(),
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
  }
}))

describe('UserService', () => {
  describe('register()', () => {
    it('should throw error 409 if email already exists', async () => {

      ;(UserRepo.findByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: 'admin@gmail.com',
        
    })
  })

  describe('list()', () => { 

   })
})
