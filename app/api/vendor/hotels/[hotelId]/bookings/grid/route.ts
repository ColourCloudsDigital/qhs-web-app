import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate parameters' },
        { status: 400 }
      );
    }
    
    // Format dates for MySQL
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    const endDateStr = new Date(endDate).toISOString().split('T')[0];
    
    console.log(`Fetching grid data for hotel ${hotelId} from ${startDateStr} to ${endDateStr}`);
    
    // Check access rights
    if (session.user.role === 'VENDOR') {
      const [hotelRows] = await pool.query(`
        SELECT h.* FROM hotels h
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE h.id = ? AND u.id = ?
      `, [hotelId, session.user.id]);
      
      if ((hotelRows as any[]).length === 0) {
        console.log(`Access denied: Hotel ${hotelId} not found or not owned by vendor ${session.user.id}`);
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
      
      console.log(`Access granted: Vendor ${session.user.id} has access to hotel ${hotelId}`);
    } else if (session.user.role === 'STAFF') {
      const [staffRows] = await pool.query(`
        SELECT s.* FROM staff s
        JOIN users u ON s.userId = u.id
        WHERE u.id = ? AND s.hotelId = ?
      `, [session.user.id, hotelId]);
      
      if ((staffRows as any[]).length === 0) {
        console.log(`Access denied: Staff ${session.user.id} does not have access to hotel ${hotelId}`);
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
      
      console.log(`Access granted: Staff ${session.user.id} has access to hotel ${hotelId}`);
    } else if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      console.log(`Access denied: User ${session.user.id} with role ${session.user.role} does not have access to hotel ${hotelId}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get rooms for the hotel
    const [roomsResult] = await pool.query(`
      SELECT id, name, type, status 
      FROM rooms
      WHERE hotelId = ?
      ORDER BY name ASC
    `, [hotelId]);
    
    const rooms = roomsResult as any[];
    console.log(`Found ${rooms.length} rooms for hotel ${hotelId}`);
    
    // Get bookings for the date range
    const [bookingsResult] = await pool.query(`
      SELECT 
        b.id,
        ru.roomId,
        b.checkInDate,
        b.checkOutDate,
        b.status,
        c.firstName,
        c.lastName,
        COALESCE(CONCAT(c.firstName, ' ', c.lastName), c.firstName, c.lastName, 'Guest') as name
      FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN customers c ON b.customerId = c.id
      WHERE b.hotelId = ?
        AND (
          (b.checkInDate <= ? AND b.checkOutDate > ?) OR
          (b.checkInDate >= ? AND b.checkInDate <= ?)
        )
    `, [hotelId, endDateStr, startDateStr, startDateStr, endDateStr]);
    
    const bookings = (bookingsResult as any[]).map(booking => ({
      id: booking.id,
      roomId: booking.roomId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      status: booking.status,
      customer: {
        name: booking.name || 'Guest',
        firstName: booking.firstName || '',
        lastName: booking.lastName || ''
      }
    }));
    
    console.log(`Found ${bookings.length} bookings for hotel ${hotelId} in the selected date range`);
    
    return NextResponse.json({ rooms, bookings });
  } catch (error) {
    console.error('Error fetching grid data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 