import JWT from 'jsonwebtoken'

const generateToken = async (payload, secret_key, expiresIn = '1h') => {
  try {
    return JWT.sign(payload, secret_key, { algorithm: 'HS256', expiresIn: expiresIn })
  } catch (error) {
    throw new Error('Token generation failed')
  }
}

const verifyToken = async (token, secret_key) => {
  try {
    return JWT.verify(token, secret_key)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken,
}
