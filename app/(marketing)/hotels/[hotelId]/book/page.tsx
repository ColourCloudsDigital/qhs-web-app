import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getHotelById } from '@/services/hotel.service';
import BookingClient from './client';

interface PageProps {
  params: {
    hotelId: string;
  };
  searchParams: {
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    roomId?: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const hotel = await getHotelById(params.hotelId);
  
  if (!hotel) {
    return {
      title: 'Hotel Not Found | Qaras Hotels',
      description: 'The requested hotel could not be found.'
    };
  }
  
  return {
    title: `Book ${hotel.name} | Qaras Hotels`,
    description: `Book your stay at ${hotel.name}. ${hotel.description.substring(0, 100)}...`
  };
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  // Check authentication (optional now)
  const session = await getServerSession(authOptions);
  
  // Get hotel details
  const hotel = await getHotelById(params.hotelId);
  
  if (!hotel) {
    notFound();
  }
  
  // Get check-in, check-out, guest count, and roomId from query params
  const { checkIn, checkOut, guests, roomId } = searchParams;
  if (!checkIn || !checkOut) {
    // Redirect back to hotel detail page if dates are not provided
    return redirect(`/hotels/${params.hotelId}`);
  }
  // Sort rooms by price (lowest first)
  const sortedRooms = [...hotel.rooms].sort((a, b) => {
    const priceA = a.discountedPrice || a.pricePerNight;
    const priceB = b.discountedPrice || b.pricePerNight;
    return priceA - priceB;
  });
  // Pass session info if available, otherwise pass null
  const customerId = session?.user?.customerId || undefined;
  const isLoggedIn = !!session?.user;
  return (
    <BookingClient 
      hotel={hotel}
      rooms={sortedRooms}
      initialCheckInDate={checkIn}
      initialCheckOutDate={checkOut}
      initialGuests={parseInt(guests || '2')}
      initialSelectedRoomId={roomId || null}
      customerId={customerId}
      isLoggedIn={isLoggedIn}
    />
  );
}