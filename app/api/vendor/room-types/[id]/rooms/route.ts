import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomTypeService } from '@/services/room-types';
import { RoomService } from '@/services/rooms';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor, staff, or admin)
    if (session.user.role !== UserRole.VENDOR && 
        session.user.role !== UserRole.STAFF && 
        session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const roomTypeId = params.id;
    
    // Get rooms by room type
    const rooms = await RoomService.getRoomsByRoomTypeId(roomTypeId);
    
    // Get room count
    const count = rooms.length;
    
    // Count total physical rooms (room numbers)
    let totalPhysicalRooms = 0;
    rooms.forEach(room => {
      totalPhysicalRooms += (room.roomNumbers?.length || 0);
    });
    
    return NextResponse.json({ 
      rooms, 
      count,
      totalPhysicalRooms
    });
  } catch (error) {
    console.error('Error fetching rooms for room type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}