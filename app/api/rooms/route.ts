import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/lib/services/room.service';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const search = searchParams.get('search') || '';
    const hotelId = searchParams.get('hotelId') || undefined;
    const status = searchParams.get('status') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;
    const capacity = searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Get rooms
    const result = await roomService.getRooms({
      page,
      limit,
      search,
      hotelId,
      status,
      minPrice,
      maxPrice,
      capacity,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}