'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, CreditCard, Users, AlertCircle, Check, Mail, Phone, User, ChevronRight, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

// Helper functions
const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Simple date formatter
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toISOString().split('T')[0];
};

interface GuestBookingFormProps {
  hotelId: string;
  roomId: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  discountedPrice?: number | null;
  maxGuests: number;
  initialGuests?: number;
}

export default function GuestBookingForm({
  hotelId,
  roomId,
  roomName,
  roomType,
  pricePerNight,
  discountedPrice,
  maxGuests,
  initialGuests = 2,
}: GuestBookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Guest details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Booking details
  const [checkInDate, setCheckInDate] = useState(searchParams?.get('checkIn') || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams?.get('checkOut') || '');
  const [numberOfGuests, setNumberOfGuests] = useState(initialGuests);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAY_AT_HOTEL');

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingSummary, setBookingSummary] = useState<{
    nights: number;
    pricePerNight: number;
    totalPrice: number;
  } | null>(null);

  // Set dates from URL parameters on component mount
  useEffect(() => {
    if (searchParams) {
      const checkIn = searchParams.get('checkIn');
      const checkOut = searchParams.get('checkOut');
      const guests = searchParams.get('guests');
      
      if (checkIn) setCheckInDate(checkIn);
      if (checkOut) setCheckOutDate(checkOut);
      if (guests) setNumberOfGuests(parseInt(guests, 10));
    }
  }, [searchParams]);

  // Calculate booking details when component loads or dates change
  useEffect(() => {
    calculateBookingDetails();
  }, [checkInDate, checkOutDate]);

  // Calculate date ranges and validate dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const minCheckInDate = formatDateString(today);
  const minCheckOutDate = checkInDate
    ? formatDateString(new Date(new Date(checkInDate).getTime() + 86400000))
    : formatDateString(tomorrow);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxCheckInDate = formatDateString(
    new Date(maxDate.getTime() - 86400000)
  );
  const maxCheckOutDate = formatDateString(maxDate);

  // Calculate booking details when dates change
  const calculateBookingDetails = async () => {
    if (checkInDate && checkOutDate) {
      try {
        setIsLoading(true);
        setError(null);

        // Check room availability first
        const availabilityResponse = await fetch(
          `/api/rooms/${roomId}/availability?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`
        );
        
        if (!availabilityResponse.ok) {
          const data = await availabilityResponse.json();
          throw new Error(data.error || 'Failed to check availability');
        }
        
        const availabilityData = await availabilityResponse.json();
        
        if (!availabilityData.isAvailable) {
          setError('This room is not available for the selected dates.');
          setBookingSummary(null);
          return;
        }
        
        // Room is available, get price info
        const { priceInfo } = availabilityData;
        
        setBookingSummary({
          nights: priceInfo.nights,
          pricePerNight: priceInfo.pricePerNight,
          totalPrice: priceInfo.totalPrice,
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred. Please try again.');
        setBookingSummary(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setBookingSummary(null);
    }
  };

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckInDate(e.target.value);
    // Clear check-out date if it's before new check-in date
    if (checkOutDate && new Date(e.target.value) >= new Date(checkOutDate)) {
      setCheckOutDate('');
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckOutDate(e.target.value);
  };

  const validateForm = () => {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!email.trim()) return 'Email is required';
    if (!isValidEmail(email)) return 'Please enter a valid email address';
    if (!phone.trim()) return 'Phone number is required';
    if (!checkInDate || !checkOutDate) return 'Please select check-in and check-out dates';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Submitting booking with data:', {
        firstName, lastName, email, phone,
        hotelId, roomId, checkInDate, checkOutDate,
        numberOfGuests, paymentMethod
      });
      
      // Single API call with all required data
      const bookingData = {
        // Guest info
        firstName,
        lastName,
        email,
        phone,
        
        // Booking info
        hotelId,
        roomId,
        checkInDate: formatDate(checkInDate),
        checkOutDate: formatDate(checkOutDate),
        numberOfGuests,
        specialRequests,
        paymentMethod
      };
      
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Booking API error:', result);
        throw new Error(result.message || result.error || 'Failed to create booking');
      }
      
      console.log('Booking successful:', result);
      
      // Success!
      setSuccess(true);
      setBookingId(result.id);
      
      // Redirect to confirmation page after a delay
      setTimeout(() => {
        router.push(`/hotels/${hotelId}?booking=success`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If booking is successful, show success message
  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/30"
        >
          <Check className="h-8 w-8 text-green-500 dark:text-green-400" />
        </motion.div>
        
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-2 text-center text-xl font-bold text-green-800 dark:text-green-400"
        >
          Booking Successful!
        </motion.h3>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-4 text-center text-green-700 dark:text-green-300"
        >
          Your booking at {roomName} has been confirmed.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-4 rounded-md bg-white p-4 text-sm dark:bg-gray-800"
        >
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Clock className="h-4 w-4" />
            <span>A confirmation email will be sent to your email address shortly.</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Book This Room
      </h3>
      
      <form onSubmit={handleSubmit}>
        {/* Room Details */}
        <div className="mb-6 rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
          <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
            {roomName}
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {roomType} Room • Max {maxGuests} {maxGuests === 1 ? 'Guest' : 'Guests'}
          </p>
          <p className="mt-2 text-primary">
            {discountedPrice ? (
              <>
                <span className="text-lg font-bold">
                  {formatCurrency(discountedPrice)}
                </span>{' '}
                <span className="text-sm line-through text-gray-500">
                  {formatCurrency(pricePerNight)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold">
                {formatCurrency(pricePerNight)}
              </span>
            )}{' '}
            <span className="text-sm text-gray-700 dark:text-gray-300">/ night</span>
          </p>
        </div>
        
        {/* Guest Information */}
        <div className="mb-6">
          <h4 className="mb-4 font-medium text-gray-900 dark:text-white">
            Guest Information
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                First Name*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  placeholder="John"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Last Name*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Phone*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking Details */}
        <div className="mb-6">
          <h4 className="mb-4 font-medium text-gray-900 dark:text-white">
            Booking Details
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkInDate"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Check-in Date*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={checkInDate}
                  onChange={handleCheckInChange}
                  min={minCheckInDate}
                  max={maxCheckInDate}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="checkOutDate"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Check-out Date*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={checkOutDate}
                  onChange={handleCheckOutChange}
                  min={minCheckOutDate}
                  max={maxCheckOutDate}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  required
                />
              </div>
            </div>
            
            <div>
              <label
                htmlFor="numberOfGuests"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Number of Guests*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="numberOfGuests"
                  name="numberOfGuests"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  required
                >
                  {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label
                htmlFor="paymentMethod"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Payment Method*
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                  required
                >
                  <option value="PAY_AT_HOTEL">Pay at Hotel</option>
                  <option value="PAYSTACK">Pay Online with Paystack</option>
                  <option value="FLUTTERWAVE">Pay Online with Flutterwave</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Special Requests */}
        <div className="mb-6">
          <label
            htmlFor="specialRequests"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Special Requests (Optional)
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="block w-full rounded-md border border-gray-300 p-2.5 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
            placeholder="Any special requests? Let us know."
          ></textarea>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}
        
        {/* Booking Summary */}
        {bookingSummary && (
          <div className="mb-6 space-y-2 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <h4 className="flex items-center font-medium text-green-800 dark:text-green-400">
              <Check className="mr-2 h-5 w-5" />
              Room is available!
            </h4>
            <div className="space-y-1 pt-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>
                  {formatCurrency(bookingSummary.pricePerNight)} x{' '}
                  {bookingSummary.nights} {bookingSummary.nights === 1 ? 'night' : 'nights'}
                </span>
                <span>{formatCurrency(bookingSummary.totalPrice)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(bookingSummary.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
        >
          {isLoading ? 'Processing...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
} 