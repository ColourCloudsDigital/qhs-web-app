import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { HotelService } from '@/services/hotels';
import BookingClient from './client';

interface PageProps {
  params: {
    hotelId: string;
    roomId: string;
  };
  searchParams: {
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const hotel = await HotelService.getHotelById(params.hotelId);

  if (!hotel) {
    return {
      title: 'Hotel Not Found | Qaras Hotels',
      description: 'The requested hotel could not be found.'
    };
  }

  // Find the room for better metadata
  const room = hotel.rooms?.find((r: any) => r.id === params.roomId);

  return {
    title: `Book ${room?.name || 'Room'} at ${hotel.name} | Qaras Hotels`,
    description: `Book your stay at ${hotel.name}. ${room?.description || hotel.description?.substring(0, 100) || ''}...`
  };
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  // Check authentication (optional now)
  const session = await getServerSession(authOptions);

  // Get hotel details
  const hotel = await HotelService.getHotelById(params.hotelId);

  if (!hotel) {
    notFound();
  }

  // Get check-in, check-out, guest count from query params
  const { checkIn, checkOut, guests } = searchParams;
  if (!checkIn || !checkOut) {
    // Redirect back to hotel detail page if dates are not provided
    return redirect(`/hotels/${params.hotelId}`);
  }

  // Sort rooms by price (lowest first)
  const sortedRooms = [...hotel.rooms].sort((a: any, b: any) => {
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
      initialSelectedRoomId={params.roomId}
      customerId={customerId}
      isLoggedIn={isLoggedIn}
    />
  );
}
