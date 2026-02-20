// This file loads environment variables from a .env file and exports them for use in the application.
// Everytime need to use env variables, just import { env } from '~/config/environment.js'
import 'dotenv/config'

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,
  LOCAL_DEV_APP_HOST: process.env.LOCAL_DEV_APP_HOST,
  LOCAL_DEV_APP_PORT: process.env.LOCAL_DEV_APP_PORT,
  MONGODB_USER: process.env.MONGODB_USER,
  MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
  AUTHOR: process.env.AUTHOR,
  BUILD_MODE: process.env.BUILD_MODE,
  WEBSITE_DOMAIN_DEVELOPMENT: process.env.WEBSITE_DOMAIN_DEVELOPMENT,
  WEBSITE_DOMAIN_PRODUCTION: process.env.WEBSITE_DOMAIN_PRODUCTION,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  ADMIN_EMAIL_ADDRESS: process.env.ADMIN_EMAIL_ADDRESS,
  ADMIN_EMAIL_NAME: process.env.ADMIN_EMAIL_NAME,
  ACCESS_JWT_SECRET_KEY: process.env.ACCESS_JWT_SECRET_KEY,
  ACCESS_JWT_EXPIRES_IN: process.env.ACCESS_JWT_EXPIRES_IN,
  REFRESH_JWT_SECRET_KEY: process.env.REFRESH_JWT_SECRET_KEY,
  REFRESH_JWT_EXPIRES_IN: process.env.REFRESH_JWT_EXPIRES_IN,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}
