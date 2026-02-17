import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
  // Check if roomId is provided in query params
  const { roomId } = searchParams;

  // If roomId is provided, redirect to the new nested route
  if (roomId) {
    const { checkIn, checkOut, guests } = searchParams;
    const queryParams = new URLSearchParams();
    if (checkIn) queryParams.set('checkIn', checkIn);
    if (checkOut) queryParams.set('checkOut', checkOut);
    if (guests) queryParams.set('guests', guests);

    const redirectUrl = `/hotels/${params.hotelId}/book/${roomId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return redirect(redirectUrl);
  }

  // If no roomId, redirect to hotel detail page (legacy behavior)
  return redirect(`/hotels/${params.hotelId}`);
}