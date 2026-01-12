'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Mail, 
  Phone,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BookingDetails {
  bookingId: string;
  hotelName: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  nights: number;
  paymentRequired: boolean;
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get booking details from URL parameters
    const bookingId = searchParams?.get('bookingId');
    const hotelName = searchParams?.get('hotelName');
    const roomName = searchParams?.get('roomName');
    const checkInDate = searchParams?.get('checkInDate');
    const checkOutDate = searchParams?.get('checkOutDate');
    const numberOfGuests = searchParams?.get('numberOfGuests');
    const totalAmount = searchParams?.get('totalAmount');
    const nights = searchParams?.get('nights');
    const paymentRequired = searchParams?.get('paymentRequired') === 'true';

    if (bookingId && hotelName && roomName && checkInDate && checkOutDate) {
      setBookingDetails({
        bookingId,
        hotelName,
        roomName,
        checkInDate,
        checkOutDate,
        numberOfGuests: parseInt(numberOfGuests || '1'),
        totalAmount: parseFloat(totalAmount || '0'),
        nights: parseInt(nights || '1'),
        paymentRequired
      });
      
      // Set flags for dashboard refresh
      if (typeof window !== 'undefined') {
        localStorage.setItem('new-booking-created', 'true');
        localStorage.setItem('new-booking-id', bookingId);
        localStorage.setItem('new-booking-timestamp', new Date().toISOString());
        
        // Clear any cached dashboard data to force refresh
        localStorage.removeItem('dashboard-bookings-cache');
        localStorage.removeItem('dashboard-hotels-cache');
      }
    }
    
    setIsLoading(false);
  }, [searchParams]);

  const handleDownloadConfirmation = () => {
    // Generate a simple text confirmation
    if (bookingDetails) {
      const confirmationText = `
BOOKING CONFIRMATION
====================

Booking Reference: ${bookingDetails.bookingId.substring(0, 8).toUpperCase()}
Hotel: ${bookingDetails.hotelName}
Room: ${bookingDetails.roomName}
Check-in: ${formatDate(bookingDetails.checkInDate)}
Check-out: ${formatDate(bookingDetails.checkOutDate)}
Guests: ${bookingDetails.numberOfGuests}
Nights: ${bookingDetails.nights}
Total Amount: ${formatCurrency(bookingDetails.totalAmount)}

Thank you for choosing Qaras Hotels!
      `;
      
      const blob = new Blob([confirmationText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-confirmation-${bookingDetails.bookingId.substring(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    if (bookingDetails && navigator.share) {
      try {
        await navigator.share({
          title: 'Booking Confirmation',
          text: `My booking at ${bookingDetails.hotelName} is confirmed! Reference: ${bookingDetails.bookingId.substring(0, 8).toUpperCase()}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `My booking at ${bookingDetails?.hotelName} is confirmed! Reference: ${bookingDetails?.bookingId.substring(0, 8).toUpperCase()}`;
      navigator.clipboard.writeText(shareText);
      alert('Booking details copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Not Found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We couldn't find your booking details. Please check your email for confirmation.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800"
        >
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your reservation has been successfully created
            </p>
          </motion.div>

          {/* Booking Reference */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 rounded-lg bg-primary/10 p-4 text-center"
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Booking Reference
            </p>
            <p className="text-2xl font-bold text-primary">
              {bookingDetails.bookingId.substring(0, 8).toUpperCase()}
            </p>
          </motion.div>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Booking Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Hotel & Room */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bookingDetails.hotelName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bookingDetails.roomName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bookingDetails.numberOfGuests} {bookingDetails.numberOfGuests === 1 ? 'Guest' : 'Guests'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bookingDetails.nights} {bookingDetails.nights === 1 ? 'Night' : 'Nights'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates & Payment */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(bookingDetails.checkInDate)} - {formatDate(bookingDetails.checkOutDate)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check-in to Check-out
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CreditCard className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(bookingDetails.totalAmount)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bookingDetails.paymentRequired ? 'Payment Required' : 'Pay at Hotel'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Important Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20"
          >
            <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-400">
              Important Information
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>A confirmation email has been sent to your email address</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>You will receive SMS updates about your booking</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Check-in time is typically 3:00 PM, check-out is 11:00 AM</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <button
              onClick={handleDownloadConfirmation}
              className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Confirmation
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Booking
            </button>

            <Link
              href="/customer/bookings"
              className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              View My Bookings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 border-t border-gray-200 pt-6 text-center dark:border-gray-700"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact our support team or{' '}
              <Link href="/" className="text-primary hover:underline">
                browse more hotels
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}