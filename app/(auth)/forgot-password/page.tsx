'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage()  {
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [themeSettings, setThemeSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const appName = themeSettings?.general?.appName || 'Qaras Hotels';
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
          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
                <p className="mt-2 text-gray-600">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/30">
                    <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
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
                
                <Button
                  type="submit"
                  fullWidth
                  disabled={isLoading}
                  rounded="lg"
                >
                  {isLoading ? 'Sending Reset Link...' : 'Reset Password'}
                </Button>
              </form>
            </>
          ) : (
            <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/30">
              <div className="mb-4 text-5xl">✉️</div>
              <h3 className="mb-2 text-xl font-bold text-green-800 dark:text-green-300">Check Your Email</h3>
              <p className="text-green-700 dark:text-green-400">
                If an account exists with that email, we&apos;ve sent a password reset link.
                Please check your inbox and follow the instructions.
              </p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-gray-900 hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Qaras Hotels. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}