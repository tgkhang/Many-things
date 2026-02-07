import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'
import { refreshTokenAPI } from '@/lib/api'

const AUTH_STORAGE_KEY = 'auth_user'
const handleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    window.location.href = '/login'
  }
}

const authorizedAxiosInstance = axios.create()
authorizedAxiosInstance.defaults.timeout = 10 * 60 * 1000 // 10 minutes
authorizedAxiosInstance.defaults.withCredentials = true

// Add a request interceptor
// this can be used to add auth token to headers if needed
authorizedAxiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let refreshTokenPromise: Promise<any> | null = null
let isRefreshing = false

// Add a response interceptor
authorizedAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    console.log('Axios error interceptor:', error.status)
    const isAuthEndpoint = error.config?.url?.includes('/login') || error.config?.url?.includes('/register')
    const isRefreshEndpoint = error.config?.url?.includes('/refresh_token')
    const isMeEndpoint = error.config?.url?.includes('/me')

    // Handle 403 from refresh endpoint - means refresh token is missing/invalid
    if (error.response?.status === 403 && isRefreshEndpoint) {
      isRefreshing = false
      refreshTokenPromise = null
      return Promise.reject(error)
    }

    // Handle 401 or 410 - Try to refresh token
    // 401 = Missing/invalid access token
    // 410 = Expired access token
    // Don't refresh for /login, /register, or /refresh_token endpoints
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      (error.response?.status === 401 || error.response?.status === 410) &&
      !isAuthEndpoint &&
      !isRefreshEndpoint &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshing
    ) {
      originalRequest._retry = true

      if (!refreshTokenPromise) {
        isRefreshing = true
        refreshTokenPromise = refreshTokenAPI()
          .then(() => {
            isRefreshing = false
            return true
          })
          .catch((refreshError) => {
            isRefreshing = false
            // Logout on refresh failure
            handleLogout()
            throw refreshError
          })
          .finally(() => {
            refreshTokenPromise = null
          })
      }

      try {
        await refreshTokenPromise
        // Tokens have been refreshed in cookies, retry the original request
        return authorizedAxiosInstance(originalRequest)
      } catch {
        // Refresh failed (handleLogout already called in the catch above)
        // Just reject the original error
        return Promise.reject(error)
      }
    }

    // If refresh failed or not applicable, and it's a 401 error (not on /me or auth endpoints), logout
    if (error.response?.status === 401 && !isAuthEndpoint && !isMeEndpoint && originalRequest?._retry) {
      handleLogout()
      return Promise.reject(error)
    }

    // Global error handling for all over the app
    let errorMessage = error?.message || 'An error occurred'

    // Check if error response from server has message, then use that message
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as { message?: string }
      if (data.message) errorMessage = data.message
    }

    // Don't show toast for:
    // - 410 errors (handled by refresh logic)
    // - refresh endpoint errors (handled silently)
    // - /me endpoint errors during initialization (expected when not logged in)
    const shouldShowToast =
      error.response?.status !== 410 &&
      !isRefreshEndpoint &&
      !(error.response?.status === 403 && isRefreshEndpoint) &&
      !isMeEndpoint

    if (shouldShowToast) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default authorizedAxiosInstance
