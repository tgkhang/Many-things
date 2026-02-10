import type { RequestHandler } from 'express'

/**
 * asyncHandler(fn) nhận vào một hàm async.
 * Trả ra một middleware Express.
 * Nếu fn throw hoặc reject Promise > lỗi tự động chạy vào next(error) > đi xuống global error middleware.
 * Không cần try/catch thủ công ở mọi controller nữa.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    return Promise.resolve(handler(req, res, next)).catch(next)
    // similar to
    // return Promise.resolve(handler(req, res, next)).catch((error) => next(error))
  }
}
