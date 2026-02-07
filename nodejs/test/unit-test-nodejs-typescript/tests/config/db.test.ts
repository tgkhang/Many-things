/**
 * test db will not connect to real db
 * create mock logic to test main case
 * - connectionMoongo() call only 1
 * getDb() throw error if not init
 *
 */

// important: mock a simple mongodb driver in top level of this file
// Jest will hoist jest.mock() in beginging of the file before any import
jest.mock('mongodb', () => {
  // ghi đè module 'mongodb' bằng mock custom
  // return an object class mongoclient replace real 'mongodb' module

  return {
    MongoClient: jest.fn(() => {
      return {
        connect: jest.fn().mockResolvedValue(undefined), // do not connect to real db
        db: jest.fn(() => ({
          collection: jest.fn(() => ({
            users: 'users',
          })),
          close: jest.fn(),
        })),
      }
    }),
  }
})

describe('database config', () => {
  const URI = 'mongodb://localhost:27017/testdb'

  beforeEach(() => {
    // clear history
    jest.clearAllMocks()

    jest.resetModules() // reset module registry to clear cached db instance
  })

  it('connectMongo() should connect to MongoDB only once', async () => {
    const { connectMongo } = await import('~/config/db')
    const { MongoClient } = await import('mongodb')

    // the jest will auto use the mocked version above instead of real one

    // call connectMongo multiple times
    await connectMongo(URI)
    await connectMongo(URI)
    await connectMongo(URI)

    // MongoClient should be called only once
    expect(MongoClient).toHaveBeenCalledTimes(1)
  })

  it('Logs connected to mongo db when successful', async () => {
    const { logger } = await import('~/config/logger')
    const mockLoggerInfo = jest.spyOn(logger, 'info')
    const { connectMongo } = await import('~/config/db')

    await connectMongo(URI)
    expect(mockLoggerInfo).toHaveBeenCalledTimes(1)
    expect(mockLoggerInfo).toHaveBeenCalledWith('Connected to MongoDB')
  })

  it('getDb() should throw error if not initialized', async () => {
    const { getDb } = await import('~/config/db')
    expect(() => getDb()).toThrow('MongoDB is not initialized')
  })

  it('col.users() should return users collection', async () => {
    const { connectMongo, col } = await import('~/config/db')

    await connectMongo(URI)
    const usersCollection = col.users()
    expect(usersCollection).toBeDefined() // collection exists
  })
})
