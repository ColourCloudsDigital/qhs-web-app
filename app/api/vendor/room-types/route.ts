import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RoomTypeService } from '@/services/room-types';
import { UserRole } from '@/lib/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor or staff)
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.STAFF && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId');
    
    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }
    
    // Get room types for the hotel
    const roomTypes = await RoomTypeService.getRoomTypes(hotelId);
    
    return NextResponse.json({ roomTypes });
  } catch (error) {
    console.error('Error fetching room types:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch room types' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor or admin)
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.hotelId) {
      return NextResponse.json({ error: 'Name and hotel ID are required' }, { status: 400 });
    }
    
    // Create room type
    const roomType = await RoomTypeService.createRoomType({
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      capacity: data.capacity,
      hotelId: data.hotelId,
      amenities: data.amenities,
    });
    
    return NextResponse.json({ roomType }, { status: 201 });
  } catch (error) {
    console.error('Error creating room type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room type' },
      { status: 500 }
    );
  }
}