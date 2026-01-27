import { NextRequest, NextResponse } from 'next/server';
import { getHotelById } from '@/services/hotel.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('API - Fetching hotel with ID:', id, typeof id);
    
    // Try to convert to number if needed - handle both string and number IDs
    const parsedId = !isNaN(Number(id)) ? Number(id).toString() : id;
    console.log('API - Parsed ID:', parsedId);
    
    const hotel = await getHotelById(parsedId);
    console.log('API - Hotel found:', hotel ? 'Yes' : 'No');

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(hotel, { status: 200 });
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel details' },
      { status: 500 }
    );
  }
} 