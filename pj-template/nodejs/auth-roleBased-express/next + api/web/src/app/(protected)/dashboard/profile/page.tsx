'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })

  const handleSave = async () => {
    try {
      await updateUser(formData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.username || 'User'}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className="mt-2">
                <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                  {user.role}
                </Badge>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            <User className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                <p className="font-medium">{user.username || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
                <p className="font-medium text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Created</p>
                <p className="font-medium text-sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role & Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role & Permissions</CardTitle>
              <CardDescription>Your account access level</CardDescription>
            </div>
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Role</p>
            <Badge variant={user.role === 'admin' ? 'info' : 'default'} className="text-base px-4 py-1">
              {user.role === 'admin' ? 'Administrator' : 'Client'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
            <p className="text-sm">
              {user.role === 'admin'
                ? 'Full system access including user management, analytics, and all administrative features.'
                : 'Standard user access for booking tickets and managing personal bookings.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>Your account statistics</CardDescription>
            </div>
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user.role === 'admin' ? '567' : '5'}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Status</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">Active</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
