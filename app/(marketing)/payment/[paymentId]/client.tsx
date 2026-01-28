'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentClientProps {
  booking: any;
}

export default function PaymentClient({ booking }: PaymentClientProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<string>('PAYSTACK');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  
  // using shared formatDate from utils
  
  // Calculate number of nights
  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Handle payment initialization
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          method: paymentMethod,
          callbackUrl: `${window.location.origin}/payment/verify`,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize payment');
      }
      
      const data = await response.json();
      
      // Redirect to payment gateway
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setSuccessUrl(`/bookings/${booking.id}/confirmation`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Redirect to success page if payment is successful
  useEffect(() => {
    if (successUrl) {
      router.push(successUrl);
    }
  }, [successUrl, router]);
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link 
          href={`/bookings/${booking.id}/confirmation`} 
          className="flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to booking
        </Link>
      </div>
      
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Complete Your Payment
      </h1>
      
      <div className="grid gap-8 md:grid-cols-3">
        {/* Payment Form Section */}
        <div className="md:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Payment Method
            </h2>
            
            {/* Payment Method Selection */}
            <div className="mb-6 space-y-3">
              <div className="relative flex cursor-pointer items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="paystack"
                    type="radio"
                    name="paymentMethod"
                    value="PAYSTACK"
                    checked={paymentMethod === 'PAYSTACK'}
                    onChange={() => setPaymentMethod('PAYSTACK')}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="paystack" className="flex cursor-pointer items-center text-gray-700 dark:text-gray-300">
                    <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
                    Pay with Card (Paystack)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Secure payment via Paystack. Your card details are encrypted.
                  </p>
                </div>
              </div>
              
              <div className="relative flex cursor-pointer items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="flutterwave"
                    type="radio"
                    name="paymentMethod"
                    value="FLUTTERWAVE"
                    checked={paymentMethod === 'FLUTTERWAVE'}
                    onChange={() => setPaymentMethod('FLUTTERWAVE')}
                    disabled={true}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:focus:ring-primary"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="flutterwave" className="flex cursor-pointer items-center text-gray-500 dark:text-gray-400">
                    <CreditCard className="mr-2 h-5 w-5 text-gray-400" />
                    Pay with Flutterwave
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      Coming Soon
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This payment method will be available soon.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Security Note */}
            <div className="mb-6 rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Your payment information is secure. We use encryption to protect your data.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full rounded-md bg-primary px-6 py-3 text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessing ? 'Processing...' : `Pay ${formatCurrency(booking.totalAmount)}`}
            </button>
          </div>
        </div>
        
        {/* Booking Summary */}
        <div className="md:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Booking Summary
            </h2>
            
            {/* Hotel Info */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {booking.hotel?.name || 'Hotel'}
              </h3>
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="mr-1 h-4 w-4" />
                {booking.hotel.city}, {booking.hotel.country}
              </div>
            </div>
            
            {/* Room Info */}
            <div className="mb-4 rounded-md bg-gray-50 p-3 dark:bg-gray-700/30">
              <p className="font-medium text-gray-900 dark:text-white">
                {booking.room?.name || 'Room'}
              </p>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {booking.room?.type || 'Standard'} Room • Max {booking.room?.capacity || 1} {(booking.room?.capacity || 1) === 1 ? 'guest' : 'guests'}
              </div>
            </div>
            
            {/* Stay Dates */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check-in</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(booking.checkInDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check-out</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(booking.checkOutDate)}
                </p>
              </div>
            </div>
            
            {/* Guests */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Guests</p>
              <div className="mt-1 flex items-center">
                <Users className="mr-1 h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
            </div>
            
            {/* Price Breakdown */}
            <div className="mb-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(booking.room.pricePerNight)} x {nights} nights
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(booking.room.pricePerNight * nights)}
                </span>
              </div>
              
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Service fee
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(booking.totalAmount * 0.1)}
                </span>
              </div>
              
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Taxes
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(booking.totalAmount * 0.05)}
                </span>
              </div>
            </div>
            
            {/* Total */}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="text-base font-bold text-primary">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}