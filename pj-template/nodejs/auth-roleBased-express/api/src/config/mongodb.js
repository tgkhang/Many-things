import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment.js'

const MONGO_URI= env.MONGODB_URI
const DATABASE_NAME= env.DATABASE_NAME

let trelloDatabaseInstance = null

// init a client instance to connect to MongoDB
const mongoClientInstance = new MongoClient(MONGO_URI, {
  // Optional settings: stable api, optional to include
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const CONNECT_DB = async () => {
  await mongoClientInstance.connect()
  trelloDatabaseInstance = mongoClientInstance.db(DATABASE_NAME)
}

export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
  trelloDatabaseInstance = null
}

// Singleton pattern to get the database instance
export const GET_DB = () => {
  if (!trelloDatabaseInstance) {
    throw new Error('MongoDB is not connected. Please call CONNECT_MONGODB first.')
  }
  return trelloDatabaseInstance
}
