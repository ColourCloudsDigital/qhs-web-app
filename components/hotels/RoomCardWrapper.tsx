'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RoomCard from './RoomCard';

interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
  images: string[];
  status: string;
  amenities: Amenity[];
}

interface RoomCardWrapperProps {
  room: Room;
  hotelId?: string; // Added hotelId prop
}

export default function RoomCardWrapper({ room, hotelId }: RoomCardWrapperProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // This function now matches the expected (roomId: string) => void signature
  const handleReserve = async (roomId: string) => {
    // Try to get checkIn, checkOut, guests from window.location.search if present
    let checkIn = '';
    let checkOut = '';
    let guests = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      checkIn = urlParams.get('checkIn') || '';
      checkOut = urlParams.get('checkOut') || '';
      guests = urlParams.get('guests') || '';
    }

    // If we have dates and the user is authenticated, attempt to create booking immediately
    if (checkIn && checkOut && session?.user) {
      try {
        const customerId = (session as any).user?.customerId;
        if (!customerId) {
          // If no customerId, redirect to book flow with new route structure
          const params = new URLSearchParams();
          if (checkIn) params.set('checkIn', checkIn);
          if (checkOut) params.set('checkOut', checkOut);
          if (guests) params.set('guests', guests);
          if (hotelId) {
            router.push(`/hotels/${hotelId}/book/${roomId}${params.toString() ? `?${params.toString()}` : ''}`);
            return;
          }
        }

        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId: hotelId || undefined,
            roomId,
            customerId: (session as any).user?.customerId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfGuests: guests ? Number(guests) : 1,
            numberOfRooms: 1, // Default to 1 room for immediate booking
            specialRequests: '',
            paymentMethod: 'PAY_AT_HOTEL'
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create booking');
        }

        const booking = await res.json();
        const bookingId = booking.bookingId || booking.id || null;
        if (!bookingId) throw new Error('Booking response missing id');

        // Notify other open windows/components that bookings changed
        try {
          const bc = new BroadcastChannel('bookings');
          bc.postMessage({ type: 'updated', bookingId });
          bc.close();
        } catch (e) {
          // BroadcastChannel may not be available; fallback to localStorage event
          try {
            localStorage.setItem('bookings-updated', JSON.stringify({ ts: Date.now(), bookingId }));
          } catch (_) {}
        }

        // Navigate to confirmation
        if (bookingId) {
          router.push(`/bookings/${bookingId}/confirmation`);
          return;
        }
      } catch (error) {
        console.error('Immediate booking failed, falling back to booking page', error);
        // Continue to fallback behavior below
      }
    }

    // Fallback: redirect to booking flow page with new route structure
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    const queryString = params.toString();
    if (hotelId) {
      router.push(`/hotels/${hotelId}/book/${roomId}${queryString ? `?${queryString}` : ''}`);
    } else {
      router.push(`/booking?${queryString}`);
    }
  };

  // When the room card is clicked
  const handleRoomClick = () => {
    if (hotelId) {
      router.push(`/hotels/${hotelId}/rooms/${room.id}`);
    }
  };

  return (
    <div onClick={handleRoomClick} className="block h-full cursor-pointer transform transition-all hover:-translate-y-1">
      <RoomCard
        id={room.id}
        name={room.name}
        type={room.type}
        description={room.description}
        capacity={room.capacity}
        pricePerNight={room.pricePerNight}
        discountedPrice={room.discountedPrice}
        images={room.images}
        status={room.status}
        amenities={room.amenities}
        hotelId={hotelId}
      />
    </div>
  );
}