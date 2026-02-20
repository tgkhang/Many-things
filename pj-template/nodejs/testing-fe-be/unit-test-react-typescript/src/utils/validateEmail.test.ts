import { validateEmail } from '~/utils/validateEmail'

describe('Unit test: validateEmail():', () => {
  const cases: any[] = [
    ['khangaa@gmail.com', true],
    ['person1@', false],
    ['@person2.com', false],
    // [{ email: 'demo@gmail.com' }, true], // ex case unexpected input
  ]

  it.each(cases)('validateEmail(%s) should return %s', (...args: any[]) => {
    const [email, expected] = args
    expect(validateEmail(email)).toBe(expected)
  })
})
