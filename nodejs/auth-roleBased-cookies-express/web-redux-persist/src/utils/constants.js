/* eslint-disable no-undef */
let apiRoot = ''

// console.log('process.env:', process.env)
// console.log('import.meta.env:', import.meta.env)

if (process.env.BUILD_MODE === 'dev') {
  apiRoot = 'http://localhost:8010'
} else if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://api.example.com'
}
// console.log('API_ROOT:', apiRoot)

export const FIELD_REQUIRED_MESSAGE = 'This field is required.'
export const API_ROOT = apiRoot
