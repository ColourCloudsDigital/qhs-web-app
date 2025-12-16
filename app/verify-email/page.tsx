'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [themeSettings, setThemeSettings] = useState<any>(null);

  // Fetch theme settings
  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/theme');
        if (response.ok) {
          const data = await response.json();
          setThemeSettings(data);
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
      }
    };

    fetchThemeSettings();
  }, []);

  // Verify email when component mounts
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check your email link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Your email has been successfully verified!');
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify your email. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [token, router]);

  const bannerImage = themeSettings?.loginBannerUrl || '/assets/images/hotel-banner.jpg';
  const primaryColor = themeSettings?.colorPalette?.primary || '#1e40af';

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <div className="relative h-40 w-full sm:h-60 md:h-80">
        <Image
          src={bannerImage}
          alt="Luxury Hotel Banner"
          className="object-cover"
          fill
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-center text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Qaras Hotels
          </h1>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Email Verification
            </h2>
          </div>
          
          <div className="rounded-md bg-white p-6 shadow-md dark:bg-gray-800">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
                <p className="text-center text-gray-700 dark:text-gray-300">{message}</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <svg 
                    className="h-12 w-12 text-green-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300">{message}</p>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Redirecting you to login...
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <svg 
                    className="h-12 w-12 text-red-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300">{message}</p>
                <div className="flex justify-center">
                  <Link
                    href="/login"
                    className="mt-2 inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 