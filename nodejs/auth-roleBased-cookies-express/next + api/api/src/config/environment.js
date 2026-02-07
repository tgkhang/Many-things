// This file loads environment variables from a .env file and exports them for use in the application.
// Everytime need to use env variables, just import { env } from '~/config/environment.js'
import 'dotenv/config'

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Server
  LOCAL_DEV_APP_HOST: process.env.LOCAL_DEV_APP_HOST,
  LOCAL_DEV_APP_PORT: process.env.LOCAL_DEV_APP_PORT,
  BUILD_MODE: process.env.BUILD_MODE,
  PORT: process.env.PORT,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  WEBSITE_DOMAIN_DEVELOPMENT: process.env.WEBSITE_DOMAIN_DEVELOPMENT,
  WEBSITE_DOMAIN_PRODUCTION: process.env.WEBSITE_DOMAIN_PRODUCTION,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  ADMIN_EMAIL_ADDRESS: process.env.ADMIN_EMAIL_ADDRESS,
  ADMIN_EMAIL_NAME: process.env.ADMIN_EMAIL_NAME,

  ACCESS_JWT_SECRET_KEY: process.env.ACCESS_JWT_SECRET_KEY,
  ACCESS_JWT_EXPIRES_IN: process.env.ACCESS_JWT_EXPIRES_IN,

  REFRESH_JWT_SECRET_KEY: process.env.REFRESH_JWT_SECRET_KEY,
  REFRESH_JWT_EXPIRES_IN: process.env.REFRESH_JWT_EXPIRES_IN,
}
