'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const { token } = params;
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Something went wrong');
        }

        setIsSuccess(true);
      } catch (error: any) {
        setError(error.message || 'An unexpected error occurred');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isVerifying
              ? 'Verifying your email address...'
              : isSuccess
              ? 'Your email has been verified successfully.'
              : 'Email verification failed.'}
          </p>
        </div>

        {isVerifying ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : isSuccess ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
              <div className="flex">
                <div className="text-sm text-green-700 dark:text-green-400">
                  Your email has been verified successfully. You can now log into your account.
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/login"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Go to login
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
              <div className="flex">
                <div className="text-sm text-red-700 dark:text-red-400">
                  {error || 'The verification link is invalid or has expired.'}
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/login"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}