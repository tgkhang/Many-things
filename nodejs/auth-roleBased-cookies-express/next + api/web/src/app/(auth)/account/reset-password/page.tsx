'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import { resetPasswordAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
  FIELD_REQUIRED_MESSAGE,
} from '@/lib/utils/validators'

interface ResetPasswordFormData {
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset link. Missing token.')
      return
    }

    try {
      await resetPasswordAPI({
        token,
        newPassword: data.newPassword,
      })
      toast.success('Password reset successfully! You can now login with your new password.')
      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      // Error toast already shown by axios interceptor
    }
  }

  // If link is invalid
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Invalid Reset Link</CardTitle>
            <CardDescription>
              The password reset link is invalid or incomplete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
            <CardDescription>
              Your password has been changed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  {...register('newPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    pattern: {
                      value: PASSWORD_RULE,
                      message: PASSWORD_RULE_MESSAGE,
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  {...register('confirmPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Password requirements:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase letter (A-Z)</li>
                <li>• Contains lowercase letter (a-z)</li>
                <li>• Contains number (0-9)</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
