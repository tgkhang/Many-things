'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermission } from '@/hooks/usePermission'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Shield, Calendar, TrendingUp, Users, Bus } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { hasPermission, hasRole } = usePermission()

  const isAdmin = hasRole('admin')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Welcome back{user?.username ? `, ${user.username}` : ''}!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and role</CardDescription>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
              <p className="font-medium">{user?.username || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
              <Badge variant={isAdmin ? 'info' : 'default'}>
                {user?.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Account ID</p>
              <p className="font-medium text-sm">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Permissions</CardTitle>
              <CardDescription>What you can do in this application</CardDescription>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hasPermission('view_dashboard') && (
              <Badge variant="success" className="justify-center py-2">
                View Dashboard
              </Badge>
            )}
            {hasPermission('edit_profile') && (
              <Badge variant="success" className="justify-center py-2">
                Edit Profile
              </Badge>
            )}
            {hasPermission('change_password') && (
              <Badge variant="success" className="justify-center py-2">
                Change Password
              </Badge>
            )}
            {hasPermission('create_booking') && (
              <Badge variant="success" className="justify-center py-2">
                Create Booking
              </Badge>
            )}
            {hasPermission('view_bookings') && (
              <Badge variant="success" className="justify-center py-2">
                View Bookings
              </Badge>
            )}
            {hasPermission('manage_users') && (
              <Badge variant="info" className="justify-center py-2">
                Manage Users
              </Badge>
            )}
            {hasPermission('view_analytics') && (
              <Badge variant="info" className="justify-center py-2">
                View Analytics
              </Badge>
            )}
            {hasPermission('manage_settings') && (
              <Badge variant="info" className="justify-center py-2">
                Manage Settings
              </Badge>
            )}
            {hasPermission('manage_buses') && (
              <Badge variant="info" className="justify-center py-2">
                Manage Buses
              </Badge>
            )}
            {hasPermission('manage_routes') && (
              <Badge variant="info" className="justify-center py-2">
                Manage Routes
              </Badge>
            )}
            {hasPermission('manage_bookings') && (
              <Badge variant="info" className="justify-center py-2">
                Manage All Bookings
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - Role Based */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-gray-500">+10% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Buses</CardTitle>
                <Bus className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-gray-500">+2 from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">567</div>
                <p className="text-xs text-gray-500">+25% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,345</div>
                <p className="text-xs text-gray-500">+15% from last month</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-gray-500">2 upcoming trips</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$250</div>
                <p className="text-xs text-gray-500">Last booking: 3 days ago</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saved Routes</CardTitle>
                <Bus className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-gray-500">Favorite destinations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,250</div>
                <p className="text-xs text-gray-500">500 points to next reward</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Role-specific sections */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left">
                <Users className="h-6 w-6 mb-2 text-blue-600" />
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-sm text-gray-500">Add, edit, or remove users</p>
              </button>
              <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left">
                <Bus className="h-6 w-6 mb-2 text-green-600" />
                <h3 className="font-medium">Manage Buses</h3>
                <p className="text-sm text-gray-500">Add or update bus information</p>
              </button>
              <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left">
                <TrendingUp className="h-6 w-6 mb-2 text-purple-600" />
                <h3 className="font-medium">View Analytics</h3>
                <p className="text-sm text-gray-500">Check system statistics</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
