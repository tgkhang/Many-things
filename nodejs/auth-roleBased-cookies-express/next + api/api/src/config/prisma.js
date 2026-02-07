import { PrismaClient } from '@prisma/client'

let prisma

const CONNECT_DB = async () => {
  try {
    // Singleton pattern to prevent multiple instances
    if (!prisma) {
      prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      })
      await prisma.$connect()
    }
    return prisma
  } catch (error) {
    console.error('Failed to connect to database:', error)
    throw error
  }
}

const CLOSE_DB = async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
}

const GET_DB = () => {
  if (!prisma) {
    throw new Error('Database not initialized. Call CONNECT_DB first.')
  }
  return prisma
}

export { CONNECT_DB, CLOSE_DB, GET_DB }
