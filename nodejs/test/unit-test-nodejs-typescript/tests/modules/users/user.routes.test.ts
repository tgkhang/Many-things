// in practical you may not need to test routes as they do not contain logic
// and the value it bring back is low

const post = jest.fn()
const get = jest.fn()

// mock express router
// ghi đè module 'express' bằng mock custom
// similar to the way we mock 'mongodb' in db.test.ts
jest.mock('express', () => ({
  Router: () => ({ post, get }),
}))

// mock validaterequest, asynhancler, user controller, register schema

const validateRequest = jest.fn(() => 'validate')
jest.mock('~/core/validate/validateRequest', () => ({
  validateRequest,
}))

const asyncHandler = jest.fn(() => 'async')
jest.mock('~/core/asyncHandler', () => ({
  asyncHandler,
}))

const UserController = {
  register: 'registerFunc',
  list: 'listFunc',
}
jest.mock('~/modules/users/user.controller', () => ({
  UserController,
}))

const RegisterSchema = 'RegisterSchema'
jest.mock('~/modules/users/user.validation', () => ({
  RegisterSchema,
}))

// test
describe('user routes', () => {
  it('wires up routes correctly', async () => {
    await import('~/modules/users/user.routes')

    // test route work correctly with middlewares and controller
    expect(post).toHaveBeenCalledWith('/register', 'validate', 'async')
    expect(get).toHaveBeenCalledWith('/list', 'async')

    // test validateRequest called with RegisterSchema
    expect(validateRequest).toHaveBeenCalledWith(RegisterSchema)

    // test asyncHandler called with correct controller methods
    expect(asyncHandler).toHaveBeenCalledWith(UserController.register)
    expect(asyncHandler).toHaveBeenCalledWith(UserController.list)
  })
})
