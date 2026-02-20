import express from 'express'
import { userRoute } from '~/routes/v1/userRoute'

const Router = express.Router()

// Use user routes
Router.use('/users', userRoute)

// Health check endpoint
Router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bus Ticket Booking API is running!',
    timestamp: new Date().toISOString(),
  })
})

export const APIs_V1 = Router
