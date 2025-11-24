import { toast } from 'react-toastify'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

export const registerUserAPI = async (userData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/register`, userData)
  toast.success('Registration successful! Please check your email to verify your account.', { theme: 'colored' })
  return response.data
}

export const verifyUserAccountAPI = async (data) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/verify_account`, data)
  toast.success('Account verified successfully! Now you can log in.', { theme: 'colored' })
  return response.data
}

export const refreshTokenAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/refresh_token`)
  return response.data
}

// Logout from all devices
export const logoutAllDevicesAPI = async () => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout_all`)
  toast.success('Logged out from all devices successfully', { theme: 'colored' })
  return response.data
}

// Forgot password - request reset email
export const forgotPasswordAPI = async (email) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot_password`, { email })
  toast.success('If an account exists with this email, a password reset link has been sent.', { theme: 'colored' })
  return response.data
}

// Reset password with token
export const resetPasswordAPI = async (data) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/reset_password`, data)
  toast.success('Password reset successfully. You can now login with your new password.', { theme: 'colored' })
  return response.data
}

// Get security events (audit log)
export const getSecurityEventsAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/security_events`)
  return response.data
}

// Get active sessions
export const getSessionsAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/sessions`)
  return response.data
}
