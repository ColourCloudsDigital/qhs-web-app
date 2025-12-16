import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@/lib/types/enums';
import { RoomService } from '@/services/rooms';
import pool from '@/lib/db';

// GET a specific room by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API ROOM] GET request for room ID: ${params.id}`);
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      console.log('[API ROOM] Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[API ROOM] User role: ${session.user.role}`);
    // Allow access for admin, staff, and vendor roles
    if (![UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.VENDOR].includes(session.user.role)) {
      console.log(`[API ROOM] Forbidden: User role ${session.user.role} not allowed`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roomId = params.id;

    try {
      console.log(`[API ROOM] Calling RoomService.getRoomById with ID: ${roomId}`);
      const room = await RoomService.getRoomById(roomId);
      console.log('[API ROOM] Room data retrieved successfully');
      console.log('[API ROOM] Room details:', {
        id: room.id,
        name: room.name,
        price: room.pricePerNight,
        roomTypeId: room.roomTypeId,
        bedType: room.bedType,
        hotelId: room.hotelId,
        hasHotelInfo: !!room.hotel,
        amenitiesCount: room.amenities?.length || 0,
        dataTypes: {
          images: typeof room.images,
          roomNumbers: typeof room.roomNumbers,
          amenities: typeof room.amenities,
        }
      });
      
      // If user is vendor, verify they own the hotel
      if (session.user.role === UserRole.VENDOR && room.hotel) {
        const userVendorId = session.user.vendorId;
        console.log(`[API ROOM] Checking hotel ownership for vendor ID: ${userVendorId}`);
        
        // Get the hotel to check ownership
        const [hotelRows] = await pool.query(
          `SELECT * FROM hotels WHERE id = ? AND vendorId = ?`,
          [room.hotel.id, userVendorId]
        );
        
        const isVendorHotel = (hotelRows as any[]).length > 0;
        
        if (!isVendorHotel) {
          console.log(`[API ROOM] Forbidden: Vendor ${userVendorId} does not own hotel ${room.hotel.id}`);
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      
      return NextResponse.json({ room });
    } catch (err) {
      console.error('[API ROOM] Error in room service:', err);
      if (err instanceof Error) {
        if (err.message === 'Room not found') {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      throw err;
    }
  } catch (error) {
    console.error('[API ROOM] Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

// PUT to update a room
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API ROOM] PUT request for room ID: ${params.id}`);
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      console.log('[API ROOM] Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[API ROOM] User role: ${session.user.role}`);
    // Allow access for admin and vendor roles
    if (![UserRole.SUPER_ADMIN, UserRole.VENDOR].includes(session.user.role)) {
      console.log(`[API ROOM] Forbidden: User role ${session.user.role} not allowed`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roomId = params.id;
    const body = await req.json();
    
    console.log(`[API ROOM] Received update data:`, JSON.stringify({
      id: body.id,
      name: body.name,
      type: body.type,
      basePrice: body.basePrice,
      pricePerNight: body.pricePerNight,
      dataTypes: {
        images: typeof body.images,
        roomNumbers: typeof body.roomNumbers,
        amenities: typeof body.amenities
      }
    }));
    
    // If user is vendor, verify they own the hotel
    if (session.user.role === UserRole.VENDOR) {
      console.log(`[API ROOM] Vendor role detected, checking ownership`);
      // Get the room to check hotel ownership
      const room = await RoomService.getRoomById(roomId);
      if (room.hotel) {
        const userVendorId = session.user.vendorId;
        console.log(`[API ROOM] Checking if vendor ${userVendorId} owns hotel ${room.hotel.id}`);
        
        const [hotelRows] = await pool.query(
          `SELECT * FROM hotels WHERE id = ? AND vendorId = ?`,
          [room.hotel.id, userVendorId]
        );
        
        const isVendorHotel = (hotelRows as any[]).length > 0;
        
        if (!isVendorHotel) {
          console.log(`[API ROOM] Forbidden: Vendor ${userVendorId} does not own hotel ${room.hotel.id}`);
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        console.log(`[API ROOM] Ownership verified successfully`);
      }
    }

    try {
      console.log(`[API ROOM] Calling RoomService.updateRoom with ID: ${roomId}`);
      const room = await RoomService.updateRoom(roomId, body);
      console.log('[API ROOM] Room updated successfully');
      return NextResponse.json({ room });
    } catch (err) {
      console.error('[API ROOM] Error in updateRoom service:', err);
      if (err instanceof Error) {
        if (err.message === 'Room not found') {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
        if (err.message.includes('cannot be empty')) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('[API ROOM] Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

// DELETE a room
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
    
    // Allow only admin to delete rooms
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roomId = params.id;

    try {
      await RoomService.deleteRoom(roomId);
      return NextResponse.json(
        { message: 'Room deleted successfully' },
        { status: 200 }
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Room not found') {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}