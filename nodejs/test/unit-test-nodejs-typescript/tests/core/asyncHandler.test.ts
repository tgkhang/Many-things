import type { Request, Response, NextFunction } from 'express'

import { asyncHandler } from '~/core/asyncHandler'

describe('asyncHandler', () => {
  it('call next(error) when handler throws error', async () => {
    // mock data function
    const req = {} as Request
    const res = {} as Response

    // unknow because jest.fn() không thể ép kiểu trực tiếp về NextFunction được
    // as unknow as something: kỹ thuật ép kiểu an toàn trong TS khi ta chắc chắn về kiểu dữ liệu nhưng TS không thể suy luận ra được
    // double assertion
    const next = jest.fn() as unknown as NextFunction

    const testError = new Error('test error')
    const handleFunc = async () => {
      throw testError
    }

    const middleware = asyncHandler(handleFunc)

    await middleware(req, res, next)
    // or you can write
    // await asyncHandler(handleFunc)(req, res, next)

    expect(next).toHaveBeenCalledWith(testError)
  })

  it('Do nothing when handler does not throw error', async () => {
    const req = {} as Request
    const res = {} as Response

    const next = jest.fn() as unknown as NextFunction

    const handleFunc = async () => {
      return 'success'
    }

    await asyncHandler(handleFunc as any)(req, res, next)
    // no error
    expect(next).not.toHaveBeenCalled()
  })
})
