import express from 'express'
import { StatusCodes } from 'http-status-codes'

import { userRoute } from '~/routes/v1/userRoute'
import { rbacRoute } from './rbacRoute'

const Router = express.Router()

// Check APIv1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'API is running' })
})

// User API routes
Router.use('/users', userRoute)

// RBAC protected routes
Router.use('/rbac', rbacRoute)

export const APIs_V1 = Router
