export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.example.com' : 'http://localhost:8010'),
}
