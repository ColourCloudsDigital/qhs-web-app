'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

interface PaymentVerifyClientProps {
  reference?: string;
  status?: string;
}

export default function PaymentVerifyClient({ 
  reference, 
  status 
}: PaymentVerifyClientProps) {
  const router = useRouter();
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState<string>('Verifying payment...');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // If no reference, set failed state
    if (!reference) {
      setVerificationState('failed');
      setMessage('No payment reference provided. Unable to verify payment.');
      return;
    }
    
    // If status is provided and it's not success, set failed state
    if (status && status !== 'successful' && status !== 'success') {
      setVerificationState('failed');
      setMessage('Payment was not successful.');
      return;
    }
    
    // Verify payment with our backend
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payments/verify/${reference}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setVerificationState('success');
          setMessage('Payment verified successfully!');
          // Set redirect URL to the booking confirmation
          if (data.booking && data.booking.id) {
            setRedirectUrl(`/bookings/${data.booking.id}/confirmation`);
          } else {
            // Fallback to dashboard if booking ID is not available
            setRedirectUrl('/dashboard');
          }
        } else {
          setVerificationState('failed');
          setMessage(data.message || 'Failed to verify payment.');
        }
      } catch (error) {
        setVerificationState('failed');
        setMessage('An error occurred while verifying payment.');
      }
    };
    
    verifyPayment();
  }, [reference, status]);
  
  // Redirect after successful verification
  useEffect(() => {
    if (verificationState === 'success' && redirectUrl) {
      const timer = setTimeout(() => {
        router.push(redirectUrl);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [verificationState, redirectUrl, router]);
  
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
        {verificationState === 'verifying' && (
          <>
            <Loader className="mx-auto mb-4 h-16 w-16 animate-spin text-primary" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Verifying Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your payment...
            </p>
          </>
        )}
        
        {verificationState === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Payment Successful!
            </h1>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Your payment has been verified successfully.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you to the booking confirmation...
            </p>
          </>
        )}
        
        {verificationState === 'failed' && (
          <>
            <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Payment Verification Failed
            </h1>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              {message}
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}