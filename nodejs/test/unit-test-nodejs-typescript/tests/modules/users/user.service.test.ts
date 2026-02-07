
import { UserService } from '~/modules/users/user.service'

describe('UserService', () => {
  it('should expose list()', () => {
    expect(typeof UserService.list).toBe('function')
  })
})
