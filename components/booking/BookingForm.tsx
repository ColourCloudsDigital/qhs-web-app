'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, Users, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BookingFormProps {
  hotelId: string;
  roomId: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  discountedPrice?: number | null;
  maxGuests: number;
  customerId?: string;
}

export default function BookingForm({
  hotelId,
  roomId,
  roomName,
  roomType,
  pricePerNight,
  discountedPrice,
  maxGuests,
  customerId,
}: BookingFormProps) {
  const router = useRouter();
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PAYSTACK');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSummary, setBookingSummary] = useState<{
    nights: number;
    pricePerNight: number;
    totalPrice: number;
  } | null>(null);

  // Calculate date ranges and validate dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const minCheckInDate = formatDateForInput(today);
  const minCheckOutDate = checkInDate
    ? formatDateForInput(new Date(new Date(checkInDate).getTime() + 86400000))
    : formatDateForInput(tomorrow);
  const maxCheckInDate = formatDateForInput(
    new Date(maxDate.getTime() - 86400000)
  );
  const maxCheckOutDate = formatDateForInput(maxDate);

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
    if (checkInDate) {
      // Calculate booking details after a short delay
      setTimeout(calculateBookingDetails, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkInDate || !checkOutDate) {
      setError('Please select check-in and check-out dates.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create the booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId,
          roomId,
          customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          specialRequests,
          paymentMethod,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }
      
      const booking = await response.json();
      
      // If payment is required, redirect to payment page
      if (booking.paymentRequired) {
        router.push(`/payment/${booking.bookingId}`);
      } else {
        // No payment required, redirect to booking confirmation page
        router.push(`/bookings/${booking.bookingId}/confirmation`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {/* Booking Dates */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="checkInDate"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Check-in Date
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
                required
                className="block w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="checkOutDate"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Check-out Date
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
                required
                disabled={!checkInDate}
                className="block w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
              />
            </div>
          </div>
        </div>
        
        {/* Number of Guests */}
        <div className="mb-4">
          <label
            htmlFor="numberOfGuests"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Number of Guests
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
              className="block w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Special Requests */}
        <div className="mb-4">
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
            className="block w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
            placeholder="Any special requests? Let us know."
          ></textarea>
        </div>
        
        {/* Payment Method */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="paystack"
                type="radio"
                name="paymentMethod"
                value="PAYSTACK"
                checked={paymentMethod === 'PAYSTACK'}
                onChange={() => setPaymentMethod('PAYSTACK')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary"
              />
              <label
                htmlFor="paystack"
                className="ml-2 flex items-center text-sm text-gray-700 dark:text-gray-300"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay with Card (Paystack)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="payAtHotel"
                type="radio"
                name="paymentMethod"
                value="PAY_AT_HOTEL"
                checked={paymentMethod === 'PAY_AT_HOTEL'}
                onChange={() => setPaymentMethod('PAY_AT_HOTEL')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary"
              />
              <label
                htmlFor="payAtHotel"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Pay at Hotel
              </label>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="mr-2 h-5 w-5" />
            {error}
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
          disabled={isLoading || !bookingSummary}
          className="w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary-light disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-primary-dark"
        >
          {isLoading ? 'Processing...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
}