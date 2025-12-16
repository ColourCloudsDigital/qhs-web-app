'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { getDashboardPath } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const redirectToDashboard = () => {
    if (session?.user?.role) {
      const redirectPath = getDashboardPath(session.user.role as UserRole);
      router.push(redirectPath);
    } else {
      router.push('/dashboard');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <ShieldX size={40} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-center text-gray-600 dark:text-gray-300">
            You do not have permission to access this page.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={redirectToDashboard}
            className="w-full rounded-md bg-primary px-4 py-2 text-center text-white hover:bg-primary-dark"
          >
            Go to Dashboard
          </button>
          
          <Link href="/" className="block w-full">
            <button className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}