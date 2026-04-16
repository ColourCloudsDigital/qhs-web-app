'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/types/enums';
import { getDashboardPath } from '@/lib/dashboard-utils';

export default function CTASection() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.role as UserRole | undefined;
  
  // Get the appropriate dashboard path for the logged-in user
  const dashboardPath = isAuthenticated ? getDashboardPath(userRole) : '/login';

  // If user is authenticated, show different content
  if (isAuthenticated) {
    return (
      <section className="bg-white py-16 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 p-8 text-center text-white shadow-lg">
            <h2 className="mb-4 text-3xl font-bold">Welcome Back to Qaras Hospitality Solutions!</h2>
            <p className="mx-auto mb-6 max-w-2xl text-lg">
              Continue managing your hotel properties and access all your tools from your dashboard. Need help or want to explore more features?
            </p>
            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href={dashboardPath}
                className="rounded-md bg-white px-6 py-3 text-lg font-medium text-blue-600 shadow-md transition-colors hover:bg-gray-100"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/contact"
                className="rounded-md border border-white bg-transparent px-6 py-3 text-lg font-medium text-white shadow-md transition-colors hover:bg-white/10"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default view for unauthenticated users
  return (
    <section className="bg-white py-16 dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="rounded-lg bg-gradient-to-r from-slate-600 to-gray-400 p-8 text-center text-white shadow-lg">
          <h2 className="mb-4 text-3xl font-bold">Ready to Transform Your Hotel Business?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg">
            Join Qaras Hospitality Solutions today and access our comprehensive suite of hotel management tools designed specifically for hotel owners and managers.
          </p>
          <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link
              href="/register?role=vendor"
              className="rounded-md bg-white px-6 py-3 text-lg font-medium text-slate-600 shadow-md transition-colors hover:bg-gray-100"
            >
              Register as a Hotel Owner
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white bg-transparent px-6 py-3 text-lg font-medium text-white shadow-md transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
