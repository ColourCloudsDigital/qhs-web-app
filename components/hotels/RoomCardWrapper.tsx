'use client';

import { useRouter } from 'next/navigation';
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

  // This function now matches the expected (roomId: string) => void signature
  const handleReserve = (roomId: string) => {
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
    const params = new URLSearchParams({ roomId });
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    if (hotelId) {
      router.push(`/hotels/${hotelId}/book?${params.toString()}`);
    } else {
      router.push(`/booking?${params.toString()}`);
    }
  };

  // When the room card is clicked
  const handleRoomClick = () => {
    if (hotelId) {
      router.push(`/hotels/${hotelId}/rooms/${room.id}`);
    }
  };

  // Create a wrapper function for the RoomCard onReserve
  // This stops propagation of click events to prevent navigation conflicts
  const handleReserveClick = (roomId: string) => {
    // We need to manually stop propagation in the RoomCard component
    handleReserve(roomId);
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
        onReserve={handleReserveClick}
      />
    </div>
  );
}