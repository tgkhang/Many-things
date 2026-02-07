import { GET_DB } from '~/config/prisma'
import { USER_ROLES } from '~/utils/constants'

const INVALID_UPDATE_FIELDS = ['id', 'email', 'createdAt', 'updatedAt', 'username']

const createNew = async (data) => {
  try {
    const prisma = GET_DB()
    const createdUser = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar || null,
        role: data.role || USER_ROLES.CLIENT,
        isActive: data.isActive || false,
        verifyToken: data.verifyToken || null,
        verifyTokenExpiry: data.verifyTokenExpiry || null,
      },
    })
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (userId) => {
  try {
    const prisma = GET_DB()
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    return user
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByEmail = async (email) => {
  try {
    const prisma = GET_DB()
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    return user
  } catch (error) {
    throw new Error(error)
  }
}

const findByPasswordResetToken = async (token) => {
  try {
    const prisma = GET_DB()
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    })
    return user
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    // Remove invalid update fields
    Object.keys(updateData).forEach((key) => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete updateData[key]
      }
    })

    const prisma = GET_DB()
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
    return updatedUser
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_ROLES,
  createNew,
  findOneById,
  findOneByEmail,
  findByPasswordResetToken,
  update,
}
