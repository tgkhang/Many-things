import cors, { CorsOptions } from 'cors'

import { env } from '~/config/env'

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim())

// Cấu hình CORS chi tiết
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Cho phép nếu không có origin (ví dụ Postman, curl)
    if (!origin && ['development', 'test', 'staging'].includes(env.NODE_ENV)) return callback(null, true)

    if (allowedOrigins.includes(origin as string)) {
      return callback(null, true)
    }
    // Nếu domain không được phép
    callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true, // cho phép gửi cookies/authorization header
  optionsSuccessStatus: 204, // trả về status code cho preflight request
  // preflight request là những request OPTIONS trước khi gửi request chính
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

export const corsMiddleware = cors(corsOptions)
