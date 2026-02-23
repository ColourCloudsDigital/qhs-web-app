import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const hotelId = params.hotelId;
    
    // Check permission
    if (session.user.role === 'VENDOR') {
      const [hotelRows] = await pool.query(
        `SELECT h.id FROM hotels h 
         JOIN vendors v ON h.vendorId = v.id 
         WHERE h.id = ? AND v.userId = ?`,
        [hotelId, session.user.id]
      );
      
      if ((hotelRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      const [staffRows] = await pool.query(
        `SELECT s.id FROM staff s 
         WHERE s.userId = ? AND s.hotelId = ?`,
        [session.user.id, hotelId]
      );
      
      if ((staffRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // Parse check-in and check-out dates
    const checkInDateParam = searchParams.get('checkInDate');
    const checkOutDateParam = searchParams.get('checkOutDate');
    
    if (!checkInDateParam || !checkOutDateParam) {
      return NextResponse.json(
        { error: 'Check-in and check-out dates are required' },
        { status: 400 }
      );
    }
    
    const checkInDate = new Date(checkInDateParam);
    const checkOutDate = new Date(checkOutDateParam);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-in date must be before check-out date' },
        { status: 400 }
      );
    }
    
    // Find rooms that are available for the given date range
    const [bookedRoomRows] = await pool.query(
      `SELECT DISTINCT roomUnitId FROM bookings 
       WHERE hotelId = ? 
       AND status IN ('CONFIRMED', 'CHECKED_IN')
       AND NOT (
         checkOutDate <= ? OR checkInDate >= ?
       )
       AND roomUnitId IS NOT NULL`,
      [hotelId, checkInDate, checkOutDate]
    );
    
    // Get room IDs from room units
    const roomUnitIds = (bookedRoomRows as any[]).map((b: any) => b.roomUnitId);
    let bookedRoomIds: string[] = [];
    
    if (roomUnitIds.length > 0) {
      const placeholders = roomUnitIds.map(() => '?').join(',');
      const [roomUnitRows] = await pool.query(
        `SELECT roomId FROM room_units WHERE id IN (${placeholders})`,
        roomUnitIds
      );
      bookedRoomIds = (roomUnitRows as any[]).map((ru: any) => ru.roomId);
    }
    
    // Get all rooms in the hotel that are not booked
    let roomQuery = `
      SELECT r.*, GROUP_CONCAT(CONCAT(a.name, ':', a.icon) SEPARATOR '|') as amenities_data
      FROM rooms r
      LEFT JOIN room_amenities ra ON r.id = ra.roomId
      LEFT JOIN amenities a ON ra.amenityId = a.id
      WHERE r.hotelId = ? 
      AND r.status != 'maintenance'
    `;
    let queryParams = [hotelId];
    
    if (bookedRoomIds.length > 0) {
      const placeholders = bookedRoomIds.map(() => '?').join(',');
      roomQuery += ` AND r.id NOT IN (${placeholders})`;
      queryParams.push(...bookedRoomIds);
    }
    
    roomQuery += ' GROUP BY r.id';
    
    const [roomRows] = await pool.query(roomQuery, queryParams);
    
    // Format room data
    const availableRooms = (roomRows as any[]).map((room: any) => {
      // Parse and select the first room number 
      let roomNumber = '';
      if (room.roomNumbers) {
        try {
          const roomNumbers = JSON.parse(room.roomNumbers as string);
          roomNumber = roomNumbers[0] || room.name;
        } catch (e) {
          console.error('Error parsing room numbers:', e);
          roomNumber = room.name;
        }
      } else {
        roomNumber = room.name;
      }
      
      // Parse amenities
      let amenities: any[] = [];
      if (room.amenities_data) {
        amenities = room.amenities_data.split('|').map((amenityStr: string) => {
          const [name, icon] = amenityStr.split(':');
          return { name, icon };
        });
      }
      
      return {
        id: room.id,
        name: room.name,
        type: room.type,
        roomNumber,
        capacity: room.capacity,
        pricePerNight: room.pricePerNight,
        discountedPrice: room.discountedPrice,
        images: room.images ? JSON.parse(room.images as string) : [],
        status: room.status,
        amenities
      };
    });
    
    return NextResponse.json({
      rooms: availableRooms
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available rooms' },
      { status: 500 }
    );
  }
}