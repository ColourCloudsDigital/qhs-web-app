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
    
    // Get total room count for the hotel
    const [totalRoomsResult] = await pool.query(`
      SELECT COUNT(*) as total FROM rooms
      WHERE hotelId = ?
    `, [hotelId]);
    
    const totalRooms = (totalRoomsResult as any[])[0]?.total || 0;
    
    // Get bookings for each day in the date range
    const [bookingsRows] = await pool.query(`
      SELECT 
        DATE(checkInDate) as date,
        COUNT(*) as count
      FROM bookings b
      JOIN rooms r ON b.roomUnitId = r.id
      WHERE r.hotelId = ? 
      AND DATE(b.checkInDate) >= ?
      AND DATE(b.checkInDate) <= ?
      GROUP BY DATE(b.checkInDate)
    `, [hotelId, startDateStr, endDateStr]);
    
    // Get a list of all dates in the range
    const dates: string[] = [];
    const current = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    // Map booking counts to dates
    const bookingCountMap = (bookingsRows as any[]).reduce((acc, item) => {
      // Convert MySQL date to ISO string format (YYYY-MM-DD)
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      acc[dateStr] = item.count;
      return acc;
    }, {} as Record<string, number>);
    
    // Create response data
    const bookings = dates.map(date => {
      const count = bookingCountMap[date] || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((count / totalRooms) * 100) : 0;
      
      return {
        date,
        count,
        occupancyRate
      };
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