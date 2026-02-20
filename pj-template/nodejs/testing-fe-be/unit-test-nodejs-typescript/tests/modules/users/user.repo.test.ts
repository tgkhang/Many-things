import { ObjectId } from 'mongodb'

import { col } from '~/config/db'
import { UserRepo } from '~/modules/users/user.repo'
import { objectIdToString } from '~/utils/objectIdToString'

jest.mock('~/config/db', () => ({
  col: {
    users: jest.fn(),
  },
}))

// mock utils objectIdToString
jest.mock('~/utils/objectIdToString', () => ({
  objectIdToString: jest.fn(),
}))

describe('UserRepo', () => {
  // define a valid objectId string for tests
  const validId = '64b64c4f4f1a256e1c8e4d3a'
  // mock method
  const findOne = jest.fn()
  const insertOne = jest.fn()
  const toArray = jest.fn()
  const find = jest.fn()

  beforeAll(() => {
    ;(col.users as jest.Mock).mockReturnValue({
      findOne,
      insertOne,
      find,
    })
  })

  it('findById() should return user when found', async () => {
    const fakeUserResponse = {
      _id: validId,
      email: 'admin@gmail.com',
    }

    findOne.mockResolvedValue(fakeUserResponse)

    const res = await UserRepo.findById(validId)
    expect(col.users).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith({ _id: new ObjectId(validId) })

    // findOne.mock.calls: storing list of calls fineOne received
    // [0] is the first call, [1] is the second call...
    // [0][0] is the first argument of the first call

    const restId = findOne.mock.calls[0][0]
    expect(restId).toEqual({ _id: new ObjectId(validId) })

    expect(res).toEqual(fakeUserResponse)
  })

  describe('findByEmail()', () => {
    it('should call findOne with correct email and return user when found', async () => {
      const fakeUserResponse = {
        _id: validId,
        email: 'admin@gmail.com',
      }
      findOne.mockResolvedValue(fakeUserResponse)

      const result = await UserRepo.findByEmail('admin@gmail.com')
      expect(col.users).toHaveBeenCalledTimes(1)
      expect(findOne).toHaveBeenCalledTimes(1)
      expect(findOne).toHaveBeenCalledWith({ email: 'admin@gmail.com' })
      expect(result).toEqual(fakeUserResponse)
    })
  })

  describe('create()', () => {
    it('should add time stamp, insert and return _id as string', async () => {
      // need to use fixed date for testing
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00Z'))

      const insertedId = new ObjectId()
      insertOne.mockResolvedValue({ insertedId })
      ;(objectIdToString as jest.Mock).mockReturnValueOnce(insertedId.toHexString())

      const createUserPayload = {
        email: 'admin@gmail.com',
        username: 'admin',
        password: 'hashed_password',
        role: 'user',
      } as any

      const result = await UserRepo.create(createUserPayload)

      expect(insertOne).toHaveBeenCalledTimes(1)
      const insertedDoc = insertOne.mock.calls[0][0]
      expect(insertedDoc).toMatchObject({
        ...createUserPayload,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })

      // created At and updatedAt should the same
      expect(insertedDoc.createdAt).toEqual(new Date('2026-01-01T10:00:00Z'))
      expect(insertedDoc.updatedAt).toEqual(new Date('2026-01-01T10:00:00Z'))

      expect(objectIdToString).toHaveBeenCalledWith(insertedId)

      expect(result).toMatchObject({
        ...insertedDoc,
        _id: insertedId.toHexString(),
      })

      // IMPORTANT: restore real timers after test that uses fake timers
      // or use in jest.setup.ts afterEach has commented out
      jest.useRealTimers()
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

      find.mockReturnValue({ toArray })

      toArray.mockResolvedValue(fakeUsers)

      const result = await UserRepo.list()

      expect(col.users).toHaveBeenCalledTimes(1)
      expect(find).toHaveBeenCalledTimes(1)
      expect(toArray).toHaveBeenCalledTimes(1)
      expect(toArray).toHaveBeenCalledTimes(1)
      expect(result).toEqual(fakeUsers)
    })
  })
})
