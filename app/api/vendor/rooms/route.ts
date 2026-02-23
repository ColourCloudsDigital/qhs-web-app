import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomService } from '@/services/rooms';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
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
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId');
    const roomTypeId = searchParams.get('roomTypeId');
    
    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }
    
    // If vendor, check if they have access to this hotel
    if (session.user.role === UserRole.VENDOR) {
      const vendorId = session.user.vendorId;
      if (!vendorId) {
        return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
      }
      
      // Check hotel ownership
      const [vendorHotelRows] = await pool.query(
        'SELECT id FROM hotels WHERE vendorId = ?',
        [vendorId]
      );
      
      const vendorHotelIds = (vendorHotelRows as any[]).map(h => String(h.id));
      if (!vendorHotelIds.includes(String(hotelId))) {
        return NextResponse.json({ error: 'You do not have permission to access rooms for this hotel' }, { status: 403 });
      }
    }
    
    // Get all rooms for the hotel using RoomService
    try {
      const rooms = await RoomService.getRoomsByHotel(hotelId);
      
      // Filter by roomTypeId if provided
      const filteredRooms = roomTypeId 
        ? rooms.filter(room => String(room.roomTypeId) === roomTypeId)
        : rooms;
      
      return NextResponse.json({ 
        rooms: filteredRooms,
        count: filteredRooms.length
      });
    } catch (error) {
      console.error('Error fetching rooms using RoomService:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch rooms' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch rooms' },
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
    
    // Check if it's a bulk operation
    if (data.bulkCreate) {
      // Validate bulk creation data
      if (!data.count || !Array.isArray(data.roomNumbers)) {
        return NextResponse.json({ error: 'Invalid bulk creation data' }, { status: 400 });
      }
      
      // Process the data
      const roomData = {
        name: data.name,
        type: data.type || 'standard',
        description: data.description,
        capacity: data.capacity || 1,
        pricePerNight: data.pricePerNight || 0,
        discountedPrice: data.discountedPrice,
        status: data.status || 'available',
        hotelId: data.hotelId,
        images: data.images || [],
        roomNumbers: data.roomNumbers,
        amenities: data.amenities,
      };
      
      // Create the room with room numbers
      const imagesString = JSON.stringify(roomData.images);
      const roomNumbersString = JSON.stringify(roomData.roomNumbers);
      
      // Create the room
      const [roomResult] = await pool.query(
        `INSERT INTO rooms (id, name, type, description, capacity, pricePerNight, discountedPrice, status, hotelId, images, roomNumbers, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          roomData.name,
          roomData.type,
          roomData.description,
          roomData.capacity,
          roomData.pricePerNight,
          roomData.discountedPrice,
          roomData.status,
          roomData.hotelId,
          imagesString,
          roomNumbersString
        ]
      );

      const roomId = (roomResult as any).insertId;

      // Get the created room
      const [newRoomRows] = await pool.query(
        'SELECT * FROM rooms WHERE id = ?',
        [roomId]
      );
      const newRoom = (newRoomRows as any[])[0];
      
      // Add amenities if provided
      if (roomData.amenities && roomData.amenities.length > 0) {
        for (const amenityId of roomData.amenities) {
          await pool.query(
            'INSERT INTO room_amenities (id, roomId, amenityId, createdAt, updatedAt) VALUES (UUID(), ?, ?, NOW(), NOW())',
            [newRoom.id, amenityId]
          );
        }
      }
      
      // Return the created room
      return NextResponse.json({
        room: {
          ...newRoom,
          roomNumbers: data.roomNumbers,
          images: roomData.images
        }
      }, { status: 201 });
    }
    else {
      // Create a single room using the existing service
      const roomData = {
        name: data.name,
        type: data.type || 'standard',
        description: data.description,
        capacity: data.capacity || 1,
        pricePerNight: data.pricePerNight || 0,
        discountedPrice: data.discountedPrice,
        status: data.status || 'available',
        hotelId: data.hotelId,
        images: data.images || [],
        amenities: data.amenities,
      };
      
      // Create the room
      const room = await RoomService.createRoom(roomData);
      
      // Update with room numbers if provided
      if (data.roomNumbers && Array.isArray(data.roomNumbers)) {
        await pool.query(
          'UPDATE rooms SET roomNumbers = ?, updatedAt = NOW() WHERE id = ?',
          [JSON.stringify(data.roomNumbers), room.id]
        );
        
        room.roomNumbers = data.roomNumbers;
      }
      
      return NextResponse.json({ room }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}