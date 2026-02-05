import type { Express } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'

import { createApp } from '~/app'
import { ApiError } from '~/core/http/ApiError'

describe('createApp', () => {
  let app: Express

  // create a isolated app, ensure test run independently
  beforeEach(() => {
    app = createApp()
  })

  it('GET /health', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('set no cache header for response', async () => {
    const res = await request(app).get('/health')

    console.log(res.headers)
    expect(res.headers['cache-control']).toContain('no-store')
    expect(res.headers['cache-control']).toContain('no-cache')
    expect(res.headers['cache-control']).toContain('must-revalidate')
    // key change to lower case? why?

    expect(res.headers['pragma']).toContain('no-cache')
    expect(res.headers['expires']).toContain('0')
  })

  it('app error', async () => {
    // init an api use only in this test scope
    app.get('/throw-error', (_req, _res) => {
      throw ApiError.BadRequest
    })

    const res = await request(app).get('/throw-error')

    console.log(res)
    expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(res.ok).toBe(false)
  })
})
