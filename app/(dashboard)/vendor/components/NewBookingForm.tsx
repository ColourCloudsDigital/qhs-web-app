'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, CreditCard, Info } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface Hotel {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  maxGuests: number;
  discountedPrice: number | null;
}

interface NewBookingFormProps {
  hotels: Hotel[];
  vendorId: string;
}

export default function NewBookingForm({ hotels, vendorId }: NewBookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
  // Get rooms when hotel changes
  useEffect(() => {
    if (!selectedHotel) return;
    
    setSelectedRoom('');
    setRooms([]);
    
    async function fetchRooms() {
      try {
        const response = await fetch(`/api/hotels/${selectedHotel}/rooms`);
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
          
          // Set default room if available
          if (data.length > 0) {
            setSelectedRoom(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    }
    
    fetchRooms();
  }, [selectedHotel]);
  
  // Calculate total amount
  const selectedRoomObj = rooms.find(room => room.id === selectedRoom);
  const pricePerNight = selectedRoomObj ? (selectedRoomObj.discountedPrice || selectedRoomObj.pricePerNight) : 0;
  
  // Calculate number of nights
  const checkInDateObj = new Date(checkInDate);
  const checkOutDateObj = new Date(checkOutDate);
  const nights = Math.max(1, Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  
  const totalAmount = pricePerNight * nights;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHotel || !selectedRoom || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Create or find customer first
      const customerResponse = await fetch('/api/customers/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: guestName.split(' ')[0],
          lastName: guestName.split(' ').slice(1).join(' ') || guestName.split(' ')[0],
          email: guestEmail,
          phone: guestPhone,
        }),
      });
      
      if (!customerResponse.ok) {
        throw new Error('Failed to create customer');
      }
      
      const customerData = await customerResponse.json();
      const customerId = customerData.id;
      
      // Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId: selectedHotel,
          roomId: selectedRoom,
          customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests: parseInt(numberOfGuests.toString()),
          specialRequests,
          paymentMethod,
          totalAmount,
          amountPaid: parseFloat(amountPaid.toString()) || 0,
          status: 'CONFIRMED',
          paymentStatus: amountPaid >= totalAmount ? 'PAID' : (amountPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING'),
        }),
      });
      
      if (!bookingResponse.ok) {
        throw new Error('Failed to create booking');
      }
      
      setSuccessMessage('Booking created successfully!');
      
      // Reset form
      setSelectedHotel('');
      setSelectedRoom('');
      setCheckInDate(format(new Date(), 'yyyy-MM-dd'));
      setCheckOutDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setNumberOfGuests(1);
      setSpecialRequests('');
      setPaymentMethod('CASH');
      setAmountPaid(0);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/vendor/bookings');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrorMessage('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p>{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Hotel Selection */}
        <div>
          <label htmlFor="hotel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Hotel*
          </label>
          <select
            id="hotel"
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          >
            <option value="">Select a hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Room Selection */}
        <div>
          <label htmlFor="room" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Room*
          </label>
          <select
            id="room"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
            disabled={!selectedHotel || rooms.length === 0}
          >
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.type}) - {room.discountedPrice ? (
                  <span className="line-through">{(room.pricePerNight / 100).toFixed(2)}</span>
                ) : (
                  (room.pricePerNight / 100).toFixed(2)
                )} {room.discountedPrice && (
                  <span>{(room.discountedPrice / 100).toFixed(2)}</span>
                )} NGN/night
              </option>
            ))}
          </select>
        </div>
        
        {/* Check-in Date */}
        <div>
          <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Check-in Date*
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="checkInDate"
              name="checkInDate"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="block w-full rounded-md border border-gray-300 pl-10 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
        </div>
        
        {/* Check-out Date */}
        <div>
          <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Check-out Date*
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="checkOutDate"
              name="checkOutDate"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={checkInDate}
              className="block w-full rounded-md border border-gray-300 pl-10 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
        </div>
        
        {/* Guest Name */}
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guest Name*
          </label>
          <input
            type="text"
            id="guestName"
            name="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        
        {/* Guest Email */}
        <div>
          <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guest Email*
          </label>
          <input
            type="email"
            id="guestEmail"
            name="guestEmail"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        
        {/* Guest Phone */}
        <div>
          <label htmlFor="guestPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guest Phone
          </label>
          <input
            type="tel"
            id="guestPhone"
            name="guestPhone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        {/* Number of Guests */}
        <div>
          <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of Guests*
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="numberOfGuests"
              name="numberOfGuests"
              value={numberOfGuests}
              onChange={(e) => setNumberOfGuests(Number(e.target.value))}
              min="1"
              max={selectedRoomObj?.maxGuests || 4}
              className="block w-full rounded-md border border-gray-300 pl-10 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
        </div>
        
        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method*
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        
        {/* Amount Paid */}
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount Paid
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="amountPaid"
              name="amountPaid"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              min="0"
              max={totalAmount}
              step="0.01"
              className="block w-full rounded-md border border-gray-300 pl-10 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Total amount: {(totalAmount / 100).toFixed(2)} NGN
          </p>
        </div>
        
        {/* Special Requests - Full width */}
        <div className="md:col-span-2">
          <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Special Requests
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary"
        >
          {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
} 