import authorizedAxiosInstance from '@/lib/axios/authorizeAxios'
import { API_ROOT } from '@/lib/utils/constants'

export const registerUserAPI = async (userData: { email: string; password: string; username: string }) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/register`, userData)
  return response.data
}

export const verifyUserAccountAPI = async (data: { email: string; token: string }) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/verify_account`, data)
  return response.data
}

export const refreshTokenAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/refresh_token`)
  return response.data
}

export const logoutAllDevicesAPI = async () => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout_all`)
  return response.data
}

export const forgotPasswordAPI = async (email: string) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot_password`, { email })
  return response.data
}

export const resetPasswordAPI = async (data: { token: string; newPassword: string }) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/reset_password`, data)
  return response.data
}

export const getMeAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/me`)
  return response.data
}
