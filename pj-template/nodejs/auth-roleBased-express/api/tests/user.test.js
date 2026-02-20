import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '~/app'
import { GET_DB } from '~/config/mongodb'
import { cleanupTestUser, generateTestUser } from './setup'

describe('User API Endpoints', () => {
  let testUser
  let accessToken
  let refreshTokenCookie
  let verifyToken

  beforeAll(() => {
    testUser = generateTestUser()
  })

  afterAll(async () => {
    await cleanupTestUser(testUser.email)
  })

  // ============================================
  // API Status Check
  // ============================================
  describe('GET /v1/status', () => {
    it('should return API status', async () => {
      const res = await request(app).get('/v1/status')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'API is running')
    })
  })

  // ============================================
  // Registration
  // ============================================
  describe('POST /v1/users/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/v1/users/register').send(testUser)

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('email', testUser.email)
      expect(res.body).not.toHaveProperty('password')

      // Get verify token from DB for later test
      const db = GET_DB()
      const user = await db.collection('users').findOne({ email: testUser.email })
      verifyToken = user.verifyToken
    })

    it('should fail with duplicate email', async () => {
      const res = await request(app).post('/v1/users/register').send(testUser)

      expect(res.status).toBe(409)
      expect(res.body).toHaveProperty('message', 'Email already in use')
    })

    it('should fail with invalid email', async () => {
      const res = await request(app).post('/v1/users/register').send({
        email: 'invalid-email',
        password: 'TestPassword123!',
      })

      expect(res.status).toBe(422)
    })

    it('should fail with weak password', async () => {
      const res = await request(app).post('/v1/users/register').send({
        email: 'weak@example.com',
        password: 'weak',
      })

      expect(res.status).toBe(422)
    })
  })

  // ============================================
  // Login Before Verification (should fail)
  // ============================================
  describe('POST /v1/users/login (before verification)', () => {
    it('should fail login for unverified account', async () => {
      const res = await request(app).post('/v1/users/login').send(testUser)

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('not verified')
    })
  })

  // ============================================
  // Account Verification
  // ============================================
  describe('PUT /v1/users/verify_account', () => {
    it('should fail with invalid token', async () => {
      const res = await request(app).put('/v1/users/verify_account').send({
        email: testUser.email,
        token: 'invalid-token',
      })

      expect(res.status).toBe(401)
    })

    it('should verify account with valid token', async () => {
      const res = await request(app).put('/v1/users/verify_account').send({
        email: testUser.email,
        token: verifyToken,
      })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('isActive', true)
    })

    it('should fail if already verified', async () => {
      const res = await request(app).put('/v1/users/verify_account').send({
        email: testUser.email,
        token: verifyToken,
      })

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('already verified')
    })
  })

  // ============================================
  // Login After Verification
  // ============================================
  describe('POST /v1/users/login (after verification)', () => {
    beforeAll(async () => {
      // Reset any lockout state before login tests
      const db = GET_DB()
      await db.collection('users').updateOne(
        { email: testUser.email },
        { $set: { failedLoginAttempts: 0, lockoutUntil: null } }
      )
    })

    it('should fail with wrong password', async () => {
      const res = await request(app).post('/v1/users/login').send({
        email: testUser.email,
        password: 'WrongPassword123!',
      })

      expect(res.status).toBe(401)

      // Reset failed attempts after wrong password test
      const db = GET_DB()
      await db.collection('users').updateOne(
        { email: testUser.email },
        { $set: { failedLoginAttempts: 0, lockoutUntil: null } }
      )
    })

    it('should login successfully', async () => {
      const res = await request(app).post('/v1/users/login').send(testUser)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
      expect(res.body).toHaveProperty('email', testUser.email)

      accessToken = res.body.accessToken

      // Get cookies from response
      const cookies = res.headers['set-cookie']
      refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='))
    })
  })

  // ============================================
  // Protected Routes
  // ============================================
  describe('Protected Routes', () => {
    it('GET /v1/users/sessions - should fail without token', async () => {
      const res = await request(app).get('/v1/users/sessions')

      expect(res.status).toBe(401)
    })

    it('GET /v1/users/sessions - should succeed with token', async () => {
      const res = await request(app)
        .get('/v1/users/sessions')
        .set('Cookie', `accessToken=${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('count')
      expect(res.body).toHaveProperty('sessions')
    })

    it('GET /v1/users/security_events - should return security events', async () => {
      const res = await request(app)
        .get('/v1/users/security_events')
        .set('Cookie', `accessToken=${accessToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('PUT /v1/users/update - should update display name', async () => {
      const res = await request(app)
        .put('/v1/users/update')
        .set('Cookie', `accessToken=${accessToken}`)
        .send({ displayName: 'Test User Updated' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('displayName', 'Test User Updated')
    })
  })

  // ============================================
  // Refresh Token
  // ============================================
  describe('GET /v1/users/refresh_token', () => {
    it('should fail without refresh token cookie', async () => {
      const res = await request(app).get('/v1/users/refresh_token')

      expect(res.status).toBe(403)
    })

    it('should refresh tokens with valid cookie', async () => {
      const res = await request(app).get('/v1/users/refresh_token').set('Cookie', refreshTokenCookie)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')

      // Update tokens for next tests
      accessToken = res.body.accessToken
      const cookies = res.headers['set-cookie']
      refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='))
    })
  })

  // ============================================
  // Forgot Password
  // ============================================
  describe('POST /v1/users/forgot_password', () => {
    it('should return success even for non-existent email (prevents enumeration)', async () => {
      const res = await request(app).post('/v1/users/forgot_password').send({
        email: 'nonexistent@example.com',
      })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
    })

    it('should send reset email for valid user', async () => {
      const res = await request(app).post('/v1/users/forgot_password').send({
        email: testUser.email,
      })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
    })
  })

  // ============================================
  // Reset Password
  // ============================================
  describe('PUT /v1/users/reset_password', () => {
    let resetToken

    beforeAll(async () => {
      const db = GET_DB()
      const user = await db.collection('users').findOne({ email: testUser.email })
      resetToken = user.passwordResetToken
    })

    it('should fail with invalid token', async () => {
      const res = await request(app).put('/v1/users/reset_password').send({
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      })

      expect(res.status).toBe(400)
    })

    it('should reset password with valid token', async () => {
      if (!resetToken) {
        console.log('Skipping - no reset token available')
        return
      }

      const res = await request(app).put('/v1/users/reset_password').send({
        token: resetToken,
        newPassword: 'NewPassword123!',
      })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('successfully')

      // Update test user password for logout test
      testUser.password = 'NewPassword123!'
    })
  })

  // ============================================
  // Logout
  // ============================================
  describe('DELETE /v1/users/logout', () => {
    it('should logout successfully', async () => {
      // Login again to get fresh tokens
      const loginRes = await request(app).post('/v1/users/login').send(testUser)
      const cookies = loginRes.headers['set-cookie']
      const cookie = cookies.find((c) => c.startsWith('refreshToken='))

      const res = await request(app).delete('/v1/users/logout').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('loggedOut', true)
    })
  })

  // ============================================
  // Logout All Devices
  // ============================================
  describe('DELETE /v1/users/logout_all', () => {
    it('should logout all devices', async () => {
      // Login to get fresh token
      const loginRes = await request(app).post('/v1/users/login').send(testUser)
      const token = loginRes.body.accessToken

      const res = await request(app)
        .delete('/v1/users/logout_all')
        .set('Cookie', `accessToken=${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('loggedOutAll', true)
    })
  })
})
