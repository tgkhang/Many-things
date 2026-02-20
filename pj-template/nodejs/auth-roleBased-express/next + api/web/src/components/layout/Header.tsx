'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Moon, Sun, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const { user, logout } = useAuth()
  const { themeName, toggleTheme } = useTheme()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-purple-600" />
              <span className="font-bold text-xl">BusBooking</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link
                    href="/dashboard/users"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                  >
                    Users
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                  >
                    Analytics
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/bookings"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                Bookings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:inline-flex">
              {themeName === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <div className="hidden md:flex items-center gap-3">
              {user && (
                <>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">{user.username || user.email}</span>
                    <Badge variant={user.role === 'admin' ? 'info' : 'default'}>{user.role}</Badge>
                  </div>
                  <Link href="/dashboard/profile">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
              {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMenu && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <nav className="flex flex-col gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                onClick={() => setShowMenu(false)}
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link
                    href="/dashboard/users"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    Users
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    Analytics
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/bookings"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                onClick={() => setShowMenu(false)}
              >
                Bookings
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                onClick={() => setShowMenu(false)}
              >
                Profile
              </Link>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <span className="text-sm font-medium">Theme</span>
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {themeName === 'light' ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </>
                  )}
                </Button>
              </div>
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
