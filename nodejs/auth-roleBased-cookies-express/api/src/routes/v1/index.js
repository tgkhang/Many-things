import express from 'express'
import { StatusCodes } from 'http-status-codes'

import { userRoute } from '~/routes/v1/userRoute'

const Router = express.Router()

// Check APIv1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'API is running' })
})

// User API routes
Router.use('/users', userRoute)

export const APIs_V1 = Router
