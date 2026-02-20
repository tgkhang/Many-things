import { beforeAll, afterAll } from 'vitest'
import { CONNECT_DB, CLOSE_DB, GET_DB } from '~/config/mongodb'

// Connect to MongoDB before all tests
beforeAll(async () => {
  await CONNECT_DB()
})

// Close MongoDB connection after all tests
afterAll(async () => {
  await CLOSE_DB()
})

// Helper to clean up test data
export const cleanupTestUser = async (email) => {
  try {
    const db = GET_DB()
    await db.collection('users').deleteOne({ email })
    await db.collection('refreshTokens').deleteMany({})
    await db.collection('auditLogs').deleteMany({})
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Test user data generator
export const generateTestUser = () => {
  const timestamp = Date.now()
  return {
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
  }
}
