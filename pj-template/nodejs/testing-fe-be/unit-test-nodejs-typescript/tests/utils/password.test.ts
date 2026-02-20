import { hashPassword, verifyPassword } from '~/utils/password'

describe('password utils', () => {
  it('hashPassword() should return a hashed password different from the original', async () => {
    const hash = await hashPassword('Demo@123')
    expect(hash).not.toBe('Demo@123')
    // hash string start with $2b$ or $2a$ or $2y$
    expect(hash).toMatch(/^\$2[aby]\$.{56}$/)
  })

  it('verifyPassword() should return true for correct password ', async () => {
    const hash = await hashPassword('Demo@123')
    const isValid = await verifyPassword('Demo@123', hash)
    expect(isValid).toBe(true)
  })

  it('verifyPassword() should return false for incorrect password ', async () => {
    const hash = await hashPassword('Demo@123')
    const isValid = await verifyPassword('WrongPassword', hash)
    expect(isValid).toBe(false)
  })
})
