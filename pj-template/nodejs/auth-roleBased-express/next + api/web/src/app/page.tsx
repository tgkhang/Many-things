'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bus, Shield, Zap } from 'lucide-react'

export default function Home() {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  // auto redirect to dashboard if authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-blue-600 to-purple-600" />
            <span className="font-bold text-3xl">BusBooking</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600">
            Book Your Bus Tickets with Ease
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience seamless bus ticket booking with our modern platform. Fast, secure, and reliable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <Bus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Book your tickets in just a few clicks with our intuitive interface
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your transactions are protected with industry-standard encryption
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Confirmation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get immediate booking confirmation and e-tickets via email
            </p>
          </div>
        </div>

        {/* Role-Based Access Information */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Different Access Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900">
              <h3 className="text-xl font-bold mb-3 text-blue-600 dark:text-blue-400">Client Access</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>✓ Book bus tickets</li>
                <li>✓ View booking history</li>
                <li>✓ Manage profile</li>
                <li>✓ Save favorite routes</li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900">
              <h3 className="text-xl font-bold mb-3 text-purple-600 dark:text-purple-400">Admin Access</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>✓ Manage users</li>
                <li>✓ Manage buses and routes</li>
                <li>✓ View analytics</li>
                <li>✓ System settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
