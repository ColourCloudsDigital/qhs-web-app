import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const [staffRows] = await pool.query(
      `SELECT s.*, h.name as hotelName 
       FROM staff s 
       JOIN hotels h ON s.hotelId = h.id 
       WHERE s.userId = ?`,
      [session.user.id]
    );

    const staff = (staffRows as any[])[0];

    if (!staff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7days'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    // Get revenue data — completed payments for this hotel only (matches vendor logic)
    const [paymentRows] = await pool.query(
      `SELECT p.amount, p.createdAt
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       WHERE b.hotelId = ?
       AND p.status = 'COMPLETED'
       AND p.createdAt >= ? AND p.createdAt <= ?`,
      [staff.hotelId, startDate, endDate]
    );

    // Get booking data
    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings 
       WHERE hotelId = ? 
       AND createdAt >= ? AND createdAt <= ?`,
      [staff.hotelId, startDate, endDate]
    );

    // Get room data for occupancy calculation
    const [roomRows] = await pool.query(
      'SELECT id FROM rooms WHERE hotelId = ?',
      [staff.hotelId]
    );

    const [roomUnitRows] = await pool.query(
      `SELECT ru.* FROM room_units ru 
       JOIN rooms r ON ru.roomId = r.id 
       WHERE r.hotelId = ?`,
      [staff.hotelId]
    );

    const totalRoomUnits = (roomUnitRows as any[]).length;

    // Process revenue data by date
    const revenueByDate = new Map();
    const bookingsByDate = new Map();

    (paymentRows as any[]).forEach((payment: any) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      const current = revenueByDate.get(date) || 0;
      revenueByDate.set(date, current + payment.amount);
    });

    (bookingRows as any[]).forEach((booking: any) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      const current = bookingsByDate.get(date) || 0;
      bookingsByDate.set(date, current + 1);
    });

    // Generate date range array
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateArray.push({
        date: dateStr,
        revenue: revenueByDate.get(dateStr) || 0,
        bookings: bookingsByDate.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Real occupancy data from bookings
    const occupancyData = await Promise.all(dateArray.map(async (item) => {
      const [occRows] = await pool.query(
        `SELECT COUNT(*) as occupied FROM bookings
         WHERE hotelId = ? AND status IN ('CONFIRMED','CHECKED_IN')
         AND checkInDate <= ? AND checkOutDate > ?`,
        [staff.hotelId, item.date, item.date]
      );
      const occupied = (occRows as any[])[0]?.occupied || 0;
      const occupancyPct = totalRoomUnits > 0 ? Math.round((occupied / totalRoomUnits) * 100) : 0;
      return { date: item.date, occupancy: occupancyPct, available: totalRoomUnits - occupied, occupied };
    }));

    return NextResponse.json({
      revenue: dateArray,
      occupancy: occupancyData,
      summary: {
        totalRevenue: Array.from(revenueByDate.values()).reduce((sum, val) => sum + val, 0),
        totalBookings: Array.from(bookingsByDate.values()).reduce((sum, val) => sum + val, 0),
        totalRoomUnits,
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
