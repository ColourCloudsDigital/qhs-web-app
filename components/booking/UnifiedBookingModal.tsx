'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Calendar, 
  CreditCard, 
  Users, 
  AlertCircle, 
  Check, 
  Mail, 
  Phone, 
  User, 
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '@/lib/toast';

interface Hotel {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
}

interface UnifiedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  room: Room;
  initialCheckInDate: string;
  initialCheckOutDate: string;
  initialGuests: number;
  isLoggedIn?: boolean;
  customerId?: string | null;
}

// Helper functions
const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export default function UnifiedBookingModal({
  isOpen,
  onClose,
  hotel,
  room,
  initialCheckInDate,
  initialCheckOutDate,
  initialGuests,
  isLoggedIn = false,
  customerId = null
}: UnifiedBookingModalProps) {
  const router = useRouter();
  
  // Guest details (only needed for non-logged-in users)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Booking details
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [numberOfGuests, setNumberOfGuests] = useState(initialGuests);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAY_AT_HOTEL');

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<{
    nights: number;
    pricePerNight: number;
    totalPrice: number;
  } | null>(null);

  // Calculate booking details when dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      calculateBookingDetails();
    }
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

  const calculateBookingDetails = async () => {
    if (checkInDate && checkOutDate) {
      try {
        setError(null);

        // Validate booking details
        const response = await fetch('/api/bookings/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hotelId: hotel.id,
            roomId: room.id,
            checkInDate,
            checkOutDate,
            numberOfGuests,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to validate booking details');
        }
        
        setBookingSummary({
          nights: data.bookingDetails.nights,
          pricePerNight: data.bookingDetails.pricePerNight,
          totalPrice: data.bookingDetails.totalAmount,
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred. Please try again.');
        setBookingSummary(null);
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
    setBookingSummary(null);
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckOutDate(e.target.value);
    setBookingSummary(null);
  };

  const validateForm = () => {
    if (!isLoggedIn) {
      if (!firstName.trim()) return 'First name is required';
      if (!lastName.trim()) return 'Last name is required';
      if (!email.trim()) return 'Email is required';
      if (!isValidEmail(email)) return 'Please enter a valid email address';
      if (!phone.trim()) return 'Phone number is required';
    }
    if (!checkInDate || !checkOutDate) return 'Please select check-in and check-out dates';
    if (numberOfGuests > room.capacity) return `This room can accommodate maximum ${room.capacity} guests`;
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
      let bookingData;
      let apiEndpoint;

      if (isLoggedIn && customerId) {
        // Logged-in user booking
        apiEndpoint = '/api/bookings';
        bookingData = {
          hotelId: hotel.id,
          roomId: room.id,
          customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          specialRequests,
          paymentMethod
        };
      } else {
        // Guest booking
        apiEndpoint = '/api/bookings/create';
        bookingData = {
          firstName,
          lastName,
          email,
          phone,
          hotelId: hotel.id,
          roomId: room.id,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          specialRequests,
          paymentMethod
        };
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create booking');
      }
      
      // Success!
      setSuccess(true);
      
      // Show success toast
      toast.success('Your booking has been confirmed!', {
        title: 'Booking Successful',
        description: `Booking reference: ${result.id.substring(0, 8).toUpperCase()}`
      });
      
      // Redirect to success page with booking details
      const successParams = new URLSearchParams({
        bookingId: result.id,
        hotelName: hotel.name,
        roomName: room.name,
        checkInDate,
        checkOutDate,
        numberOfGuests: numberOfGuests.toString(),
        totalAmount: result.bookingDetails?.totalAmount?.toString() || bookingSummary?.totalPrice?.toString() || '0',
        nights: result.bookingDetails?.nights?.toString() || bookingSummary?.nights?.toString() || '1',
        paymentRequired: result.bookingDetails?.paymentRequired?.toString() || 'false'
      });
      
      setTimeout(() => {
        router.push(`/booking-success?${successParams.toString()}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating booking:', err);
      const errorMessage = err.message || 'Failed to complete booking. Please try again.';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        title: 'Booking Failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If booking is successful, show success message
  if (success) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/30"
              >
                <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
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
                Your booking at {room.name} has been confirmed.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-4 rounded-md bg-white p-4 text-sm dark:bg-gray-700"
              >
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Clock className="h-4 w-4" />
                  <span>Redirecting to confirmation page...</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
            onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Book {room.name}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Room Details */}
                <div className="mb-6 rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                    {room.name}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {room.type} Room • Max {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                  </p>
                  <p className="mt-2 text-primary">
                    {room.discountedPrice ? (
                      <>
                        <span className="text-lg font-bold">
                          {formatCurrency(room.discountedPrice)}
                        </span>{' '}
                        <span className="text-sm line-through text-gray-500">
                          {formatCurrency(room.pricePerNight)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">
                        {formatCurrency(room.pricePerNight)}
                      </span>
                    )}{' '}
                    <span className="text-sm text-gray-700 dark:text-gray-300">/ night</span>
                  </p>
                </div>
                
                {/* Guest Information (only for non-logged-in users) */}
                {!isLoggedIn && (
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
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            placeholder="+1 234 567 8900"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
                          value={checkInDate}
                          onChange={handleCheckInChange}
                          min={minCheckInDate}
                          className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                          value={checkOutDate}
                          onChange={handleCheckOutChange}
                          min={minCheckOutDate}
                          className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                          value={numberOfGuests}
                          onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                          className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          required
                        >
                          {Array.from({ length: room.capacity }, (_, i) => i + 1).map((num) => (
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
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 p-2.5 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !bookingSummary}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Book Now'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}