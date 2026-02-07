'use client'

import { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react'
import { toast } from 'sonner'
import authorizedAxiosInstance from '@/lib/axios/authorizeAxios'
import { API_ROOT } from '@/lib/utils/constants'
import { getMeAPI } from '@/lib/api'

const AUTH_STORAGE_KEY = 'auth_user'

interface User {
  id: string
  email: string
  username?: string
  role: 'admin' | 'client'
  permissions?: string[]
  avatar?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<User>
  logout: (showSuccessMessage?: boolean) => Promise<void>
  updateUser: (data: Partial<User>) => Promise<User>
}

const AuthContext = createContext<AuthContextType | null>(null)

export { AuthContext }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsInitialized(true)

          // Verify cookies are still valid by calling /me in background
          // This happens AFTER setting initialized to avoid blocking the UI
          try {
            const response = await getMeAPI()
            setUser(response)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
              localStorage.removeItem(AUTH_STORAGE_KEY)
              setUser(null)
            }
          }
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          setUser(null)
          setIsInitialized(true)
        }
      } else {
        // No localStorage, but maybe we have valid cookies?
        // Only check cookies if we're not on auth pages (login/register)
        const isAuthPage =
          typeof window !== 'undefined' &&
          (window.location.pathname.includes('/login') ||
            window.location.pathname.includes('/register') ||
            window.location.pathname.includes('/forgot-password'))

        if (!isAuthPage) {
          // Try to get current user info from API
          try {
            console.log('No stored user, calling /me to check auth status')
            const response = await getMeAPI()
            setUser(response)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            // No valid cookies, user is not authenticated
            if (error.response?.status === 401 || error.response?.status === 403) {
              setUser(null)
            }
          }
        }

        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  // Sync user to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }, [user, isInitialized])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, {
      email,
      password,
    })
    const userData = response.data
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async (showSuccessMessage = true) => {
    try {
      await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
      if (showSuccessMessage) {
        toast.success('Logged out successfully')
      }
    } catch {
      toast.error('Failed to logout. Please try again.')
    }
    // even if API fails, clear local state
    setUser(null)
  }, [])

  const updateUser = useCallback(async (data: Partial<User>) => {
    const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/update`, data)
    const updatedUser = response.data
    setUser(updatedUser)
    return updatedUser
  }, [])

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

export default AuthProvider
