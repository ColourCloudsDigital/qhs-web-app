import { NextRequest, NextResponse } from 'next/server';
import { getHotels } from '@/services/hotel.service';

export const dynamic = 'force-dynamic';


// Public endpoint to list hotels with basic filters for customer-facing pages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;
    const location = searchParams.get('location') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const capacity = searchParams.get('capacity') ? Number(searchParams.get('capacity')) : undefined;
    const amenities = searchParams.getAll('amenities');
    const filters = {
      location,
      minPrice,
      maxPrice,
      capacity,
      amenities: amenities.length ? amenities : undefined,
    };

    const { hotels, pagination } = await getHotels(filters, page, limit);

    return NextResponse.json({ hotels, pagination });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}

