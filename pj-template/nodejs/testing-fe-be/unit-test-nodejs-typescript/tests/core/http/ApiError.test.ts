import { StatusCodes } from 'http-status-codes'

import { ApiError } from '~/core/http/ApiError'

describe('ApiError', () => {
  it('Constructor should set status, message, details', () => {
    const details = { field: 'username', reason: 'required' }
    const error = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Invalid input username', details)

    expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    expect(error.message).toBe('Invalid input username')
    expect(error.details).toEqual(details)
  })

  it('Should be instance of ApiError and Error', () => {
    const error = new ApiError(StatusCodes.NOT_FOUND, 'Resource not found')
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(Error)
  })

  it('should have stack trace', () => {
    const error = new ApiError(StatusCodes.FORBIDDEN, 'Access denied')

    expect(typeof error.stack).toBe('string')
    expect(error.stack).toContain('ApiError')
  })

  it('method BadRequest should return 400 with default message', () => {
    const error = ApiError.BadRequest()

    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(error.message).toBe('Bad Request')
    expect(error.details).toBeUndefined()
  })

  it('method BadRequest should return custom message and data', () => {
    const details = { field: 'email', reason: 'invalid format' }
    const error = ApiError.BadRequest('Invalid email format', details)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(error.message).toBe('Invalid email format')
    expect(error.details).toEqual(details)
  })
})
