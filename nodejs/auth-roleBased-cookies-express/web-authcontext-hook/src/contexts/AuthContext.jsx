import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

const AUTH_STORAGE_KEY = 'auth_user'

// Create Context (not exported to satisfy Fast Refresh)
const AuthContext = createContext(null)

// Export context for custom hook usage
export { AuthContext }

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setIsInitialized(true)
  }, [])

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }, [user, isInitialized])

  // Login function
  const login = useCallback(async (email, password) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, {
      email,
      password,
    })
    const userData = response.data
    setUser(userData)
    return userData
  }, [])

  // Logout function
  const logout = useCallback(async (showSuccessMessage = true) => {
    try {
      await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
      if (showSuccessMessage) {
        toast.success('Logged out successfully')
      }
    } catch {
      // Even if API fails, clear local state
    }
    setUser(null)
  }, [])

  // Update user function
  const updateUser = useCallback(async (data) => {
    const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/update`, data)
    const updatedUser = response.data
    setUser(updatedUser)
    return updatedUser
  }, [])

  // Context value
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isInitialized,
      login,
      logout,
      updateUser,
    }),
    [user, isInitialized, login, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export as both named and default to satisfy Fast Refresh and existing imports
export { AuthProvider }
export default AuthProvider
