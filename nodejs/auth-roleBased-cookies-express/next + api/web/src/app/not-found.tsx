import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600">
          404
        </h1>
        <h2 className="text-3xl font-bold">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
