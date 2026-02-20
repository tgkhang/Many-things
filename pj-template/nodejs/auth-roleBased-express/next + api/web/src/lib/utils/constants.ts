// API Root URL - uses environment variable or defaults based on NODE_ENV
const getApiRoot = () => {
  // Use NEXT_PUBLIC_API_URL if defined
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Fallback to NODE_ENV based defaults
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.example.com' // Update this for production deployment
  }

  return 'http://localhost:8010'
}

export const API_ROOT = getApiRoot()
export const FIELD_REQUIRED_MESSAGE = 'This field is required.'
