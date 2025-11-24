import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { corsOptions } from '~/config/cors.js'

const app = express()

// Security headers with helmet
app.use(helmet())

// Fix caching issues for API responses
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.use(cookieParser())
app.use(cors(corsOptions))

// Middleware to parse JSON request bodies with size limit
app.use(express.json({ limit: '10kb' }))
app.use('/v1', APIs_V1)

// Middleware for handling errors globally
app.use(errorHandlingMiddleware)

export default app
