import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;

    const isCustomerOwnAccount =
      session.user.role === 'CUSTOMER' &&
      session.user.customerId &&
      session.user.customerId === customerId;

    const isAdmin =
      session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN';

    if (!isCustomerOwnAccount && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Total bookings
    const [totalRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM bookings WHERE customerId = ?`,
      [customerId]
    );
    const totalBookings = totalRows[0]?.total || 0;

    // Active/upcoming bookings (confirmed or pending with future check-in)
    const [upcomingRows]: any = await pool.query(
      `SELECT 
         SUM(CASE WHEN status IN ('CONFIRMED','PENDING','CHECKED_IN') THEN 1 ELSE 0 END) as activeBookings,
         SUM(CASE WHEN checkInDate >= CURDATE() AND status IN ('CONFIRMED','PENDING') THEN 1 ELSE 0 END) as upcomingBookings
       FROM bookings
       WHERE customerId = ?`,
      [customerId]
    );

    const activeBookings = upcomingRows[0]?.activeBookings || 0;
    const upcomingBookings = upcomingRows[0]?.upcomingBookings || 0;

    // Total spent (excluding cancelled)
    const [spentRows]: any = await pool.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as totalSpent
       FROM bookings
       WHERE customerId = ? AND status <> 'CANCELLED'`,
      [customerId]
    );
    const totalSpent = Number(spentRows[0]?.totalSpent || 0);

    // Favorite city (most visited)
    const [cityRows]: any = await pool.query(
      `SELECT h.city, COUNT(*) as visits
       FROM bookings b
       JOIN hotels h ON b.hotelId = h.id
       WHERE b.customerId = ?
       GROUP BY h.city
       ORDER BY visits DESC
       LIMIT 1`,
      [customerId]
    );

    const favoriteCity = cityRows[0]?.city || null;

    // Simple loyalty points: 1 point per 1,000 currency units spent
    const loyaltyPoints = Math.floor(totalSpent / 1000);

    return NextResponse.json({
      totalBookings,
      activeBookings,
      upcomingBookings,
      totalSpent,
      favoriteCity,
      loyaltyPoints,
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer stats' },
      { status: 500 }
    );
  }
}


