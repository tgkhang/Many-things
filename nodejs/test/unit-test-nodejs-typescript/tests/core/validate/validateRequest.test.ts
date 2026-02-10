import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'

import { ApiError } from '~/core/http/ApiError'
import { validateRequest, ZodEmptyObject } from '~/core/validate/validateRequest'

describe('validateRequest middleware', () => {
  it('Valid request (success) => call next function', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
      query: ZodEmptyObject,
      params: ZodEmptyObject,
    })

    const req = {
      body: { email: 'admin@gmail.com' },
      query: {},
      params: {},
    } as unknown as Request

    const res = {} as Response
    const next = jest.fn() as unknown as NextFunction

    // create middle from schema
    const validateRequestMiddleware = validateRequest(schema)
    const callMiddleware = () => validateRequestMiddleware(req, res, next)

    // check do not throw error
    expect(callMiddleware).not.toThrow()
    // check next function need to be call 1
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('Invalid request (fail) => throw ApiError.BadRequest with message and details data', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        profile: z.object({
          age: z.number().int().min(18),
        }),
      }),
      query: z.object({
        // coerce: tự động chuyển kiểu dữ liệu thanh number trước khi validate
        page: z.coerce.number().int().min(1).optional(),
      }),
      params: z.object({
        userId: z.string().min(1),
      }),
    })

    // Invalid request data
    const req = {
      body: { email: 'adminsdf', profile: { age: 16 } },
      query: {
        page: '0',
      },
      params: {
        userId: '',
      },
    } as unknown as Request

    const res = {} as Response
    const next = jest.fn() as unknown as NextFunction

    try {
      validateRequest(schema)(req, res, next)

      // in this case we expect error, so if test run sucessfully in try block, we force fail it
      // we need to run the test in catch block
      throw new Error('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).statusCode).toBe(StatusCodes.BAD_REQUEST)

      console.log((error as ApiError).message)
      // check message
      expect((error as ApiError).message).toContain('Validation error')
      expect((error as ApiError).message).toContain('body.email')
      expect((error as ApiError).message).toContain('body.profile.age')
      expect((error as ApiError).message).toContain('query.page')
      expect((error as ApiError).message).toContain('params.userId')

      // check details data have map
      console.log((error as ApiError).details)

      expect((error as ApiError).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'body.email', message: expect.any(String) }),
          expect.objectContaining({ path: 'body.profile.age', message: expect.any(String) }),
          expect.objectContaining({ path: 'query.page', message: expect.any(String) }),
          expect.objectContaining({ path: 'params.userId', message: expect.any(String) }),
        ])
      )

      expect(next).not.toHaveBeenCalled()
    }
  })
})
