import { GET_DB } from '~/config/prisma'

const createNew = async (data) => {
  try {
    const prisma = GET_DB()
    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        familyId: data.familyId,
        expiresAt: new Date(data.expiresAt),
        isRevoked: data.isRevoked || false,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
      },
    })
    return refreshToken
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByToken = async (token) => {
  try {
    const prisma = GET_DB()
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    })
    return refreshToken
  } catch (error) {
    throw new Error(error)
  }
}

const findByUserId = async (userId) => {
  try {
    const prisma = GET_DB()
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
    })
    return tokens
  } catch (error) {
    throw new Error(error)
  }
}

// Revoke a specific token
const revokeToken = async (token) => {
  try {
    const prisma = GET_DB()
    const result = await prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Revoke all tokens in a family (for rotation breach detection)
const revokeTokenFamily = async (familyId) => {
  try {
    const prisma = GET_DB()
    const result = await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Revoke all tokens for a user (logout from all devices)
const revokeAllUserTokens = async (userId) => {
  try {
    const prisma = GET_DB()
    const result = await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Delete expired tokens (cleanup job)
const deleteExpiredTokens = async () => {
  try {
    const prisma = GET_DB()
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Count active sessions for a user
const countActiveSessions = async (userId) => {
  try {
    const prisma = GET_DB()
    const count = await prisma.refreshToken.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    })
    return count
  } catch (error) {
    throw new Error(error)
  }
}

export const refreshTokenModel = {
  createNew,
  findOneByToken,
  findByUserId,
  revokeToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  deleteExpiredTokens,
  countActiveSessions,
}
