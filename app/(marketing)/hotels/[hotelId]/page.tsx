import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HotelDetailClient from './client';

interface PageProps {
  params: {
    hotelId: string;
  };
}

async function getHotelData(id: string) {
  try {
    // Ensure ID is properly formatted (trim any whitespace)
    const cleanId = id.trim();
    console.log('Page - Cleaned hotel ID for fetching:', cleanId);

    // Add ID normalization for numeric IDs
    const normalizedId = !isNaN(Number(cleanId)) ? Number(cleanId).toString() : cleanId;
    console.log('Page - Using normalized hotel ID:', normalizedId);

    // For server components, we can use relative URLs or localhost
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      : 'http://localhost:3000';
    const url = `${baseUrl}/api/hotels/${normalizedId}`;
    console.log('Page - Fetch URL:', url);

    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Page - Fetch status:', res.status, 'OK:', res.ok);

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No response text');
      console.log('Page - Fetch error response:', errorText);
      return null;
    }

    const data = await res.json();
    console.log('Page - Raw API response:', JSON.stringify(data, null, 2));
    console.log('Page - Hotel data found:', !!data, 'Has hotel property:', !!data.hotel);

    if (data.hotel) {
      console.log('Page - Hotel details:', {
        id: data.hotel.id,
        name: data.hotel.name,
        roomsCount: data.hotel.rooms?.length || 0
      });
    }

    return data.hotel;
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  console.log('Page - Generating metadata for hotel ID:', params.hotelId);
  const hotel = await getHotelData(params.hotelId);

  if (!hotel) {
    return {
      title: 'Hotel Not Found | Qaras Hotels',
      description: 'The requested hotel could not be found.'
    };
  }
  return {
    title: `${hotel.name} | Qaras Hotels`,
    description: hotel.description.substring(0, 160) + (hotel.description.length > 160 ? '...' : '')
  };
}

export default async function HotelDetailPage({ params }: PageProps) {
  console.log('Page - Rendering page for hotel ID:', params.hotelId, typeof params.hotelId);
  const hotel = await getHotelData(params.hotelId);

  console.log('Page - Hotel data result:', hotel ? 'Found' : 'Not found');
  if (hotel) {
    console.log('Page - Hotel details:', {
      id: hotel.id,
      name: hotel.name,
      hasRooms: Array.isArray(hotel.rooms) && hotel.rooms.length > 0,
      roomCount: hotel.rooms?.length || 0
    });
  }

  if (!hotel) {
    console.log('Page - Hotel not found, returning 404');
    notFound();
  }
  console.log('Page - Hotel found, processing data:', hotel.id);

  // Check if hotel has rooms
  const hasRooms = Array.isArray(hotel.rooms) && hotel.rooms.length > 0;

  // Sort rooms by price (lowest first) if we have any
  const sortedRooms = hasRooms
    ? [...hotel.rooms].sort((a, b) => {
        const priceA = a.discountedPrice || a.pricePerNight;
        const priceB = b.discountedPrice || b.pricePerNight;
        return priceA - priceB;
      })
    : [];

  // Get the lowest price for the reservation panel
  const lowestPriceRoom = sortedRooms[0];
  const lowestPrice = lowestPriceRoom?.pricePerNight;
  const lowestDiscountedPrice = lowestPriceRoom?.discountedPrice;

  return (
    <HotelDetailClient
      hotel={hotel}
      sortedRooms={sortedRooms}
      lowestPrice={lowestPrice}
      lowestDiscountedPrice={lowestDiscountedPrice}
    />
  );
}