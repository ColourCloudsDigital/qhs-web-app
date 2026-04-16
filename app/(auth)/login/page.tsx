'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const errorType = searchParams.get('error');
  const verified = searchParams.get('verified');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [themeSettings, setThemeSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Set error message based on URL parameter
  useEffect(() => {
    if (verified === '1') {
      setSuccessMessage('Email verified successfully! You can now log in.');
    }
    if (errorType) {
      switch (errorType) {
        case 'CredentialsSignin':
          setError('Invalid email or password');
          break;
        case 'ACCOUNT_INACTIVE':
          setError('Your account has been deactivated. Please contact support.');
          break;
        case 'EMAIL_NOT_VERIFIED':
          setError('Please verify your email address before logging in.');
          break;
        default:
          setError('An error occurred during sign in');
          break;
      }
    }
  }, [errorType]);

  // Fetch theme settings
  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        const response = await fetch('/api/theme');
        if (response.ok) {
          const data = await response.json();
          setThemeSettings(data);
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThemeSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // Handle specific error messages
        if (result.error === 'ACCOUNT_INACTIVE') {
          setError('Your account has been deactivated. Please contact support.');
        } else if (result.error === 'EMAIL_NOT_VERIFIED') {
          setError('Please verify your email address before logging in.');
          setUnverifiedEmail(email);
        } else if (result.error.includes('Database') || result.error.includes('Invalid credentials')) {
          // Handle database errors with a user-friendly message
          console.error('Database error:', result.error);
          setError('Invalid email or password. Please try again.');
        } else {
          setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
        }
        setIsLoading(false);
        return;
      }

      // If we have specific callbackUrl, use it — but never redirect back to auth pages or generic /dashboard
      const safeCallbackUrl = callbackUrl && 
        !callbackUrl.startsWith('/login') && 
        !callbackUrl.startsWith('/register') &&
        !callbackUrl.startsWith('/verify-email') &&
        !callbackUrl.startsWith('/forgot-password') &&
        callbackUrl !== '/dashboard'
          ? callbackUrl 
          : null;

      // Hard navigate so the middleware can read the fresh session cookie and redirect to the right dashboard
      window.location.href = safeCallbackUrl || '/dashboard';
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setError('');
        alert('Verification email has been sent. Please check your inbox.');
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      setError('An error occurred while sending verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = themeSettings?.colorPalette?.primary || '#000000';
  const appName = themeSettings?.general?.appName || 'Qaras Hospitality Solutions';
  const quote = "Effortless Stays";

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden w-[45%] relative text-white md:block">
        <Image 
          src="/assets/images/place.jpg"
          alt="Hotel background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative flex h-full flex-col p-12 z-10">
          <div className="mb-8">
            <div className="text-sm font-medium uppercase tracking-wider">{quote}</div>
          </div>
          
          <div className="mt-auto">
            <h1 className="text-5xl font-bold leading-tight">
              Get <br />
              Everything <br />
              You Want
            </h1>
            <p className="mt-6 text-sm">
              From check-in to check-out, manage every moment with ease. Your guests deserve the best—so does your workflow.
            </p>
            <p className="mt-6 text-xs italic">
              photo by Toa Heftiba
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-16">
        <div className="mb-auto flex justify-end">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/images/logo.svg"
              alt="Logo"
              width={80}
              height={80}
              className="mr-2"
            />
          </Link>
        </div>
        
        <div className="mx-auto flex w-full max-w-md flex-col justify-center flex-1">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">
              Enter your email and password to access your account
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/30">
                <div className="text-sm text-green-700 dark:text-green-400">{successMessage}</div>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/30">
                <div className="flex flex-col">
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                  {error.includes('verify your email') && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="mt-2 text-sm font-medium hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Resend verification email
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              showPasswordToggle
            />
            
            <div className="flex items-center justify-between">
              <Checkbox
                id="remember-me"
                name="remember-me"
                label="Remember me"
                checked={rememberMe}
                onChange={setRememberMe}
              />
              
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Forgot Password
              </Link>
            </div>
            
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              rounded="lg"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-gray-900 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Qaras Hospitality Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}