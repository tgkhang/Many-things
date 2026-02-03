import { Request, Response, NextFunction } from 'express'

import { ApiError } from '~/core/http/ApiError'
import { errorHandler } from '~/core/http/errorHandler'

describe('errorHandler', () => {
  it('Case: ApiError return status code, message, detail', () => {
    const res = {
      // mock return this: cho phép chain function, goi noi tiep ex: res.status().json()
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response

    // create instance of api error status 400 (bad request)
    // const error = new ApiError(400, 'Bad Request', { field: 'username' })
    const error = ApiError.BadRequest('Invalid input', { field: 'username' })
    // call error handler
    const req = {} as Request
    const next = {} as NextFunction
    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid input',
      details: { field: 'username' },
    })
  })

  it('Case: Unhandled error return 500', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response

    // unexpected case not in custom api error
    const error = new Error('Some unexpected error')
    const req = {} as Request
    const next = {} as NextFunction
    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
    })
  })
})
