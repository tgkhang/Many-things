'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" expand={false} richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  )
}
