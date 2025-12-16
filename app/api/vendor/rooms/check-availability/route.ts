import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RoomService } from '@/services/rooms';
import { UserRole } from '@/lib/types/enums';

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
    if (!data.hotelId || !data.roomNumbers) {
      return NextResponse.json(
        { error: 'Hotel ID and room numbers are required' },
        { status: 400 }
      );
    }
    
    // Check room number availability
    const availabilityCheck = await RoomService.checkRoomNumbersAvailability(
      data.hotelId,
      data.roomNumbers,
      data.excludeRoomId
    );
    
    return NextResponse.json(availabilityCheck);
  } catch (error) {
    console.error('Error checking room number availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check room number availability' },
      { status: 500 }
    );
  }
}