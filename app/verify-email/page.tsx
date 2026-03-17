'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Prevent double-invocation in React StrictMode
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);

          // Redirect to login with success message after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=1');
          }, 3000);
        } else {
          if (data.expired) {
            setStatus('expired');
            setUserEmail(data.email);
          } else {
            setStatus('error');
          }
          setMessage(data.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email');
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResendVerification = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Verification email has been resent. Please check your inbox.');
      } else {
        alert(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      alert('An error occurred while sending verification email');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/assets/images/logo.svg"
              alt="Logo"
              width={100}
              height={100}
              className="mx-auto"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'loading' && (
            <div className="rounded-lg bg-blue-50 p-6 text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-blue-800">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <div className="mb-4 text-5xl">✓</div>
              <h3 className="mb-2 text-xl font-bold text-green-800">Success!</h3>
              <p className="text-green-700">{message}</p>
              <p className="mt-4 text-sm text-gray-600">
                Redirecting to login page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg bg-red-50 p-6 text-center">
              <div className="mb-4 text-5xl">✗</div>
              <h3 className="mb-2 text-xl font-bold text-red-800">Verification Failed</h3>
              <p className="text-red-700">{message}</p>
              <div className="mt-6">
                <Link href="/login">
                  <Button fullWidth>Go to Login</Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="rounded-lg bg-yellow-50 p-6 text-center">
              <div className="mb-4 text-5xl">⏱</div>
              <h3 className="mb-2 text-xl font-bold text-yellow-800">Token Expired</h3>
              <p className="text-yellow-700">{message}</p>
              <div className="mt-6 space-y-3">
                <Button fullWidth onClick={handleResendVerification}>
                  Resend Verification Email
                </Button>
                <Link href="/login">
                  <Button fullWidth variant="outline">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="font-medium text-gray-900 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
