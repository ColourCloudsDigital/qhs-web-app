// components/hotel/ReservationPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import ModernDatePicker, { DateRange } from '@/components/ui/ModernDatePicker';

interface ReservationPanelProps {
  hotelId: string;
  lowestPrice: number;
  discountedPrice?: number | null;
  rooms?: any[]; // optional rooms array with availability info
}

export default function ReservationPanel({ 
  hotelId, 
  lowestPrice, 
  discountedPrice 
, rooms
}: ReservationPanelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentDate = new Date();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: currentDate,
    endDate: new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000)
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [guests, setGuests] = useState<number>(2);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [nights, setNights] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [taxes, setTaxes] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  
  // Calculate nights difference and total price when dates change
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      // Calculate difference in milliseconds and convert to days
      const diffTime = Math.abs(dateRange.endDate.getTime() - dateRange.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setNights(diffDays);
      
      // Calculate total price
      const price = discountedPrice || lowestPrice;
      const roomTotal = price * diffDays;
      setTotalPrice(roomTotal);
      
      // Calculate additional fees
      const fee = Math.round(roomTotal * 0.1);
      const tax = Math.round(roomTotal * 0.05);
      
      setServiceFee(fee);
      setTaxes(tax);
      setGrandTotal(roomTotal + fee + tax);
    }
  }, [dateRange, lowestPrice, discountedPrice]);

  // Initialize selected room from rooms prop when available
  useEffect(() => {
    if (!selectedRoomId && rooms && rooms.length > 0) {
      const firstAvailable = rooms.find((r: any) => (r.availableUnits ?? 0) > 0) || rooms[0];
      setSelectedRoomId(firstAvailable?.id || null);
    }
  }, [rooms, selectedRoomId]);
  
  const handleDateChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const checkIn = formatDateForUrl(dateRange.startDate);
    const checkOut = formatDateForUrl(dateRange.endDate);

    // If user is not authenticated, redirect to the booking page to continue
    if (!session?.user) {
      router.push(`/hotels/${hotelId}/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&roomId=${selectedRoomId || ''}`);
      return;
    }

    // If no selected room, fallback to redirect
    if (!selectedRoomId) {
      router.push(`/hotels/${hotelId}/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
      return;
    }

    try {
      const customerId = (session as any).user?.customerId;
      if (!customerId) {
        router.push(`/hotels/${hotelId}/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&roomId=${selectedRoomId}`);
        return;
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          roomId: selectedRoomId,
          customerId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: guests,
          specialRequests: '',
          paymentMethod: 'PAY_AT_HOTEL'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create booking');
      }

      const booking = await res.json();
      // Redirect to booking confirmation page if available
      router.push(`/bookings/${booking.id}/confirmation`);
    } catch (err) {
      console.error('Reservation failed', err);
      alert(err instanceof Error ? err.message : 'Unable to reserve room.');
    }
  };
  
  function formatDateForUrl(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  return (
    <div className="sticky top-20 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(discountedPrice || lowestPrice)}
          </span>
          {discountedPrice && (
            <span className="ml-2 text-sm text-gray-500 line-through dark:text-gray-400">
              {formatCurrency(lowestPrice)}
            </span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md border border-gray-300 dark:border-gray-600">
          {/* Dates - now a single clickable element */}
          <div 
            className="flex cursor-pointer flex-col border-b border-gray-300 p-4 dark:border-gray-600" 
            onClick={() => setIsDatePickerOpen(true)}
          >
            <label className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Dates
            </label>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {dateRange.startDate && dateRange.endDate ? (
                `${formatDisplayDate(dateRange.startDate)} - ${formatDisplayDate(dateRange.endDate)}`
              ) : 'Select dates'}
            </span>
          </div>
          
          <div className="p-4 space-y-4">
            {rooms && rooms.length > 0 && (
              <div>
                <label className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Room Type
                </label>
                <div className="relative">
                  <select
                    id="roomType"
                    value={selectedRoomId || ''}
                    onChange={(e) => setSelectedRoomId(e.target.value || null)}
                    className="w-full appearance-none border-0 bg-transparent py-1 text-sm font-medium text-gray-900 focus:outline-none dark:text-white"
                  >
                    {rooms.map((room: any) => (
                      <option key={room.id} value={room.id} disabled={(room.availableUnits ?? 0) === 0}>
                        {room.name} {`(${room.availableUnits ?? 0} available)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Guests
              </label>
              <div className="relative">
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full appearance-none border-0 bg-transparent py-1 text-sm font-medium text-gray-900 focus:outline-none dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Date Picker Popup - now with onClose handler */}
        {isDatePickerOpen && (
          <ModernDatePicker
            onChange={handleDateChange}
            onClose={() => setIsDatePickerOpen(false)}
            initialStartDate={dateRange.startDate}
            initialEndDate={dateRange.endDate}
            minDate={new Date()}
            label="Select dates"
          />
        )}
        
        <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatCurrency(discountedPrice || lowestPrice)} x {nights} nights
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Service fee
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(serviceFee)}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Taxes
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(taxes)}
            </span>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-600">
            <div className="flex items-center justify-between font-medium">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-lg text-gray-900 dark:text-white">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-3 text-center font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Reserve Now
        </button>
      </form>
      
      <div className="mt-4 flex items-start">
        <Info className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          You won&apos;t be charged yet. Payment will be required upon arrival or according to the hotel&apos;s policies.
        </p>
      </div>
    </div>
  );
}