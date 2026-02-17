import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomService } from '@/services/rooms';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    console.log('[API] GET room by ID:', params.roomId);
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      console.log('[API] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor, staff, or admin)
    if (session.user.role !== UserRole.VENDOR && 
        session.user.role !== UserRole.STAFF && 
        session.user.role !== UserRole.SUPER_ADMIN) {
      console.log('[API] Forbidden - user role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const roomId = params.roomId;
    console.log('[API] Fetching room with ID:', roomId);
    
    // First do a direct database check if the room exists at all
    try {
      const [roomCheck] = await pool.query(
        `SELECT id, hotelId FROM rooms WHERE id = ?`,
        [roomId]
      );
      
      if (!(roomCheck as any[]).length) {
        console.log(`[API] Room with ID ${roomId} not found in database`);
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      
      console.log(`[API] Room exists in database, ID: ${roomId}, fetching details`);
    } catch (dbError) {
      console.error('[API] Database error checking room existence:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    try {
      // Get room with full details
      const room = await RoomService.getRoomById(roomId);
      console.log('[API] Room found, checking permissions');
      
      // Now check permissions based on the found room
      if (session.user.role === UserRole.VENDOR) {
        const vendorId = session.user.vendorId;
        console.log('[API] Vendor access check - session vendorId:', vendorId, 'hotel vendorId:', room.hotel.vendorId);
        
        if (!vendorId) {
          console.error('[API] Vendor session missing vendorId');
          return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
        }
        
        // Check if this hotel belongs to the vendor
        if (!room.hotel.vendorId || room.hotel.vendorId !== vendorId) {
          console.log('[API] Permission denied - hotel does not belong to vendor');
          return NextResponse.json({ 
            error: 'You do not have permission to access this room' 
          }, { status: 403 });
        }
      }
      
      // Check authorization for staff
      if (session.user.role === UserRole.STAFF) {
        const staffId = session.user.staffId;
        console.log('[API] Staff access check - staffId:', staffId, 'hotelId:', room.hotelId);
        
        const [staffResults] = await pool.query(
          `SELECT * FROM staff
           WHERE id = ? AND hotelId = ?`,
          [staffId, room.hotelId]
        );
        
        if ((staffResults as any[]).length === 0) {
          console.log('[API] Permission denied - staff not assigned to this hotel');
          return NextResponse.json({ 
            error: 'You do not have permission to access this room' 
          }, { status: 403 });
        }
      }
      
      // Get similar rooms in the same hotel
      let similarRooms: any[] = [];
      try {
        similarRooms = await RoomService.getSimilarRooms(roomId, room.hotelId, room.type);
        console.log('[API] Got similar rooms:', similarRooms.length);
      } catch (similarError) {
        console.error('[API] Error getting similar rooms:', similarError);
        // Non-fatal, continue without similar rooms
        similarRooms = [];
      }
      
      // Return room data with similar rooms
      return NextResponse.json({ 
        room,
        similarRooms
      });
      
    } catch (error) {
      console.error('[API] Error fetching room data:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Room not found',
        details: error instanceof Error ? error.stack : undefined
      }, { status: 404 });
    }
  } catch (error) {
    console.error('[API] Unhandled error in GET room:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch room',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    console.log('[API VENDOR ROOM] PUT request received for room ID:', params.roomId);
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      console.log('[API VENDOR ROOM] Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor or admin)
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      console.log('[API VENDOR ROOM] Forbidden: User role not allowed:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const roomId = params.roomId;
    console.log('[API VENDOR ROOM] Checking permissions for room ID:', roomId);
    
    // Check if room exists and if vendor has permission using MySQL
    const [roomResults] = await pool.query(
      `SELECT r.*, h.id as hotelId, h.vendorId 
       FROM rooms r
       JOIN hotels h ON r.hotelId = h.id
       WHERE r.id = ?`,
      [roomId]
    );
    
    const roomWithHotel = (roomResults as any[]).length > 0 ? (roomResults as any[])[0] : null;
    
    if (!roomWithHotel) {
      console.log('[API VENDOR ROOM] Room not found with ID:', roomId);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    console.log('[API VENDOR ROOM] Room found, hotel ID:', roomWithHotel.hotelId);
    
    // Check authorization for vendors
    if (session.user.role === UserRole.VENDOR) {
      console.log('[API VENDOR ROOM] Checking vendor permission, vendor ID:', session.user.vendorId);
      if (roomWithHotel.vendorId !== session.user.vendorId) {
        console.log('[API VENDOR ROOM] Permission denied - hotel vendor ID:', roomWithHotel.vendorId, 'session vendor ID:', session.user.vendorId);
        return NextResponse.json({ 
          error: 'You do not have permission to update this room' 
        }, { status: 403 });
      }
      console.log('[API VENDOR ROOM] Vendor permission verified');
    }
    
    // Parse request body
    const requestBody = await req.text();
    console.log('[API VENDOR ROOM] Raw request body:', requestBody);
    
    let data;
    try {
      data = JSON.parse(requestBody);
    } catch (error) {
      console.error('[API VENDOR ROOM] Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
  
    // Log the received data for debugging
    console.log('[API VENDOR ROOM] Parsed request data:', {
      id: roomId,
      name: data.name,
      type: data.type,
      description: data.description,
      pricePerNight: data.pricePerNight,
      capacity: data.capacity,
      images: Array.isArray(data.images) ? data.images.length : 'not an array',
      amenities: Array.isArray(data.amenities) ? data.amenities.length : 'not an array'
    });

    // Update the room
    try {
      const updatedRoom = await RoomService.updateRoom(roomId, data);
      console.log('[API VENDOR ROOM] Room updated successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Room updated successfully',
        room: updatedRoom
      });
    } catch (error) {
      console.error('[API VENDOR ROOM] Error updating room:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to update room',
        details: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API VENDOR ROOM] Unhandled error in PUT room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow admin to delete rooms
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roomId = params.roomId;

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