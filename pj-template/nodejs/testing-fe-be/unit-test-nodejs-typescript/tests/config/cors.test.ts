import express, { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'

import { corsMiddleware } from '~/config/cors'

describe('corsMiddleware', () => {
  // create a simple express app to test cors
  const createTestApp = () => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/test-cors', (req: Request, res: Response) => {
      res.json({ ok: true })
    })
    return app
  }

  it('allow request when origin is in whitelist', async () => {
    const allowedDomain = 'http://localhost:5173'
    const app = createTestApp()

    const res = await request(app).get('/test-cors').set('Origin', allowedDomain)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('block request when origin is not in whitelist', async () => {
    const disallowedDomain = 'http://malicious-domain.com'
    const app = createTestApp()

    const res = await request(app).get('/test-cors').set('Origin', disallowedDomain)

    // error handler in my project return 500, it may vary based on your implementation
    expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(res.ok).toBe(false)
    //expect(JSON.stringify(res.error)).toContain('Error: Origin http://malicious-domain.com is not allowed by CORS')
  })

  it('Allow request without origin (postman, curl, etc.)', async () => {
    const app = createTestApp()
    const res = await request(app).get('/test-cors')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
