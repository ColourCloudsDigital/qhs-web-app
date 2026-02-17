import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomTypeService } from '@/services/room-types';
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
    
    // Get room type
    const roomType = await RoomTypeService.getRoomTypeById(roomTypeId);
    
    return NextResponse.json({ roomType });
  } catch (error) {
    console.error('Error fetching room type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch room type' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const roomTypeId = params.id;
    
    // Parse request body
    const data = await req.json();
    
    // Update room type
    const roomType = await RoomTypeService.updateRoomType(roomTypeId, {
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      capacity: data.capacity,
      amenities: data.amenities,
    });
    
    return NextResponse.json({ roomType });
  } catch (error) {
    console.error('Error updating room type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update room type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const roomTypeId = params.id;
    
    // Delete room type
    await RoomTypeService.deleteRoomType(roomTypeId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete room type' },
      { status: 500 }
    );
  }
}