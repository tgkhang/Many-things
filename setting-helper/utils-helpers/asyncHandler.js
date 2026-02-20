export const asyncHandler1 = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * Middleware xử lý lỗi bất đồng bộ trong Express routes
 * @param {Function} fn - Hàm xử lý route async
 * @returns {Function} Middleware function với error handling
 */
export const asyncHandler2 = function (fn) {
  // Trả về một middleware function
  return async function (req, res, next) {
    try {
      // Thực thi hàm async và await kết quả
      await fn(req, res, next)
    } catch (error) {
      // Chuyển lỗi đến error handling middleware
      next(error)
    }
  }
}


export const asyncHandler3 = function (fn) {
  // Trả về một middleware function
  return function (req, res, next) {
    // Sử dụng Promise.resolve để đảm bảo fn trả về Promise
    Promise.resolve(fn(req, res, next)).catch(function (error) {
      // Xử lý lỗi và chuyển đến error handler
      next(error)
    })
  }
}