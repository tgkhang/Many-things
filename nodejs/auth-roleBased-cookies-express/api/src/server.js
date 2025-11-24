/* eslint-disable no-console */
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment.js'
import app from '~/app'

const START_SERVER = () => {
  const hostname = env.LOCAL_DEV_APP_HOST || 'localhost'
  const PORT = env.LOCAL_DEV_APP_PORT || 3000

  app.listen(PORT, hostname, () => {
    console.log(`3.Server running at http://${hostname}:${PORT}/`)
  })

  // Cleanup tasks before exit application
  exitHook(() => {
    console.log('\n4.Exiting application, closing MongoDB connection...')
    CLOSE_DB()
    console.log('5.MongoDB connection closed.')
  })
}

// Using async/await syntax IIFE
;(async () => {
  try {
    console.log('1.Connecting to MongoDB...')
    await CONNECT_DB()
    console.log('2.Connected to MongoDB successfully!')
    START_SERVER()
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(0)
  }
})()
