'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { lightTheme, darkTheme, Theme, ThemeName } from '@/config/theme'

interface ThemeContextType {
  theme: Theme
  themeName: ThemeName
  toggleTheme: () => void
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as ThemeName
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeName(savedTheme)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setThemeName(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', themeName)
      document.documentElement.classList.toggle('dark', themeName === 'dark')
    }
  }, [themeName, mounted])

  const toggleTheme = () => {
    setThemeName((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (theme: ThemeName) => {
    setThemeName(theme)
  }

  const theme = themeName === 'light' ? lightTheme : darkTheme

  if (!mounted) {
    return null
  }

  // them provider is a warpper use ThemeContext.Provider to provide the context value
  return <ThemeContext.Provider value={{ theme, themeName, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  // instead of calling useContext(ThemeContext) directly, we create a custom hook
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
