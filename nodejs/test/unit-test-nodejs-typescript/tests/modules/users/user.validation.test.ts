import { RegisterSchema } from '~/modules/users/user.validation'

describe('User Validation', () => {
  // helper function  to create input
  const createInput = (data?: Partial<any>) => ({
    body: {
      email: 'admin@gmail.com',
      username: 'admin',
      password: 'password123',
      ...data?.body, // help override body if needed
    },
    query: {},
    params: {},
  })

  it('should pass validation with valid input', () => {
    const result = RegisterSchema.safeParse(createInput())
    expect(result.success).toBe(true)
  })

  it('should fail validation with invalid email', () => {
    const result = RegisterSchema.safeParse(
      createInput({
        body: {
          email: 'invalid-email', // override with invalid email
        },
      })
    )
    expect(result.success).toBe(false)
  })

  it('should fail validation with short password ', () => {
    const result = RegisterSchema.safeParse(
      createInput({
        body: {
          password: 'short', // override with short password
        },
      })
    )
    expect(result.success).toBe(false)
  })

  it('should fail validation when body missing required fields', () => {
    const result = RegisterSchema.safeParse({
      query: {},
      params: {},
    })
    expect(result.success).toBe(false)
  })
})
