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
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roomId = searchParams.get('roomId');       // filter by rooms.id (all units of a room)
    const roomUnitId = searchParams.get('roomUnitId'); // filter by specific room_unit.id
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate parameters' },
        { status: 400 }
      );
    }
    
    // Format dates for MySQL
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    const endDateStr = new Date(endDate).toISOString().split('T')[0];
    
    // Check access rights
    if (session.user.role === 'VENDOR') {
      const [hotelRows] = await pool.query(`
        SELECT h.* FROM hotels h
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE h.id = ? AND u.id = ?
      `, [hotelId, session.user.id]);
      
      if ((hotelRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      const [staffRows] = await pool.query(`
        SELECT s.* FROM staff s
        JOIN users u ON s.userId = u.id
        WHERE u.id = ? AND s.hotelId = ?
      `, [session.user.id, hotelId]);
      
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
    
    // Get total room UNITS count (not room types) for accurate occupancy rate
    let totalRooms = 1;
    if (!roomId && !roomUnitId) {
      const [totalRoomsResult] = await pool.query(`
        SELECT COUNT(ru.id) as total
        FROM room_units ru
        JOIN rooms r ON ru.roomId = r.id
        WHERE r.hotelId = ?
      `, [hotelId]);
      totalRooms = (totalRoomsResult as any[])[0]?.total || 1;
    }

    // Build filter clause — roomUnitId takes priority over roomId
    let unitFilter = '';
    let unitParams: any[] = [hotelId, endDateStr, startDateStr];

    if (roomUnitId) {
      unitFilter = 'AND ru.id = ?';
      unitParams = [hotelId, roomUnitId, endDateStr, startDateStr];
    } else if (roomId) {
      unitFilter = 'AND ru.roomId = ?';
      unitParams = [hotelId, roomId, endDateStr, startDateStr];
    }

    const [bookingsRows] = await pool.query(`
      SELECT 
        b.id,
        DATE(b.checkInDate) as checkIn,
        DATE(b.checkOutDate) as checkOut,
        b.status,
        CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) as guestName
      FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      LEFT JOIN customers c ON b.customerId = c.id
      WHERE r.hotelId = ?
      ${unitFilter}
      AND b.checkInDate <= ?
      AND b.checkOutDate >= ?
      AND b.status NOT IN ('CANCELLED')
      ORDER BY b.checkInDate ASC
    `, unitParams);

    // Build a map of date -> count of overlapping bookings
    const bookingCountMap: Record<string, number> = {};
    const bookingList = bookingsRows as any[];

    // For each booking, mark every day it covers
    for (const booking of bookingList) {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const cur = new Date(checkIn);
      while (cur < checkOut) {
        const dateStr = cur.toISOString().split('T')[0];
        bookingCountMap[dateStr] = (bookingCountMap[dateStr] || 0) + 1;
        cur.setDate(cur.getDate() + 1);
      }
    }
    
    // Get a list of all dates in the range
    const dates: string[] = [];
    const current = new Date(startDateStr);
    const end = new Date(endDateStr);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Create response data
    const bookings = dates.map(date => {
      const count = bookingCountMap[date] || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((count / totalRooms) * 100) : 0;
      return { date, count, occupancyRate };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
} 