import Link from 'next/link';
import { Button } from '@/components/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <AlertTriangle className="w-24 h-24 text-primary-500" />
        </div>

        <div>
          <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-2xl font-semibold text-gray-900 mb-2">
            Page Not Found
          </p>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="primary" size="lg">
              Go Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Error Code: 404</p>
        </div>
      </div>
    </div>
  );
}