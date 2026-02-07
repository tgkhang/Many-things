'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyUserAccountAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AccountVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const email = searchParams.get('email')
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyAccount = async () => {
      if (!email || !token) {
        setStatus('error')
        setMessage('Invalid verification link. Missing email or token.')
        return
      }

      try {
        await verifyUserAccountAPI({ email, token })
        setStatus('success')
        setMessage('Your account has been verified successfully!')

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/login?verifiedEmail=${email}`)
        }, 3000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setStatus('error')
        const errorMessage = error?.response?.data?.message || 'Verification failed. The link may be invalid or expired.'
        setMessage(errorMessage)
        // Note: Error toast is already shown by axios interceptor
      }
    }

    verifyAccount()
  }, [email, token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Account'}
            {status === 'success' && 'Account Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your account...'}
            {status === 'success' && 'You will be redirected to login shortly'}
            {status === 'error' && 'There was a problem verifying your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {status === 'loading' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifying: <strong>{email}</strong>
              </p>
            )}
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-green-700 dark:text-green-400">
                  {message}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Redirecting to login page...
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {message}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push('/register')}
                    variant="outline"
                    className="w-full"
                  >
                    Register Again
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
