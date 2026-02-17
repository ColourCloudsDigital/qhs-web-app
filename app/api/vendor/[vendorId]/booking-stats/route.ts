import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and authorized
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = params.vendorId;

    // Only allow if the user is a vendor with this ID or a super admin
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      (session.user.role !== 'VENDOR' || session.user.vendorId !== vendorId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract timeframe from query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'current_month';

    // Calculate date range based on timeframe
    const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
    
    console.log(`Calculating stats for vendor ${vendorId} from ${startDate} to ${endDate}`);

    // Get the total number of bookings (don't filter by createdAt to ensure we count all bookings)
    const [totalBookingsResult] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM bookings b 
       JOIN hotels h ON b.hotelId = h.id 
       WHERE h.vendorId = ?`,
      [vendorId]
    );
    const totalBookings = (totalBookingsResult as any[])[0].count || 0;
    console.log(`Total bookings: ${totalBookings}`);

    // Get the number of bookings by status
    const [statusCountsResult] = await pool.query(
      `SELECT 
         b.status, 
         COUNT(*) as count 
       FROM bookings b 
       JOIN hotels h ON b.hotelId = h.id 
       WHERE h.vendorId = ? 
       GROUP BY b.status`,
      [vendorId]
    );
    
    const statusCounts = statusCountsResult as any[];
    const pendingBookings = statusCounts.find(s => s.status === 'PENDING')?.count || 0;
    const confirmedBookings = statusCounts.find(s => s.status === 'CONFIRMED')?.count || 0;
    const checkedInBookings = statusCounts.find(s => s.status === 'CHECKED_IN')?.count || 0;
    const cancelledBookings = statusCounts.find(s => s.status === 'CANCELLED')?.count || 0;
    
    console.log(`Status counts:`, { pendingBookings, confirmedBookings, checkedInBookings, cancelledBookings });

    // Get the total revenue (sum of all booking amounts)
    const [revenueResult] = await pool.query(
      `SELECT 
         COALESCE(SUM(b.totalAmount), 0) as totalRevenue 
       FROM bookings b 
       JOIN hotels h ON b.hotelId = h.id 
       WHERE h.vendorId = ? 
       AND b.status != 'CANCELLED'`,
      [vendorId]
    );
    const totalRevenue = (revenueResult as any[])[0].totalRevenue || 0;
    console.log(`Total revenue: ${totalRevenue}`);

    // Calculate occupancy rate
    // First, get total room-nights capacity
    const [capacityResult] = await pool.query(
      `SELECT 
         COUNT(ru.id) as totalRoomUnits
       FROM room_units ru
       JOIN rooms r ON ru.roomId = r.id
       JOIN hotels h ON r.hotelId = h.id
       WHERE h.vendorId = ?`,
      [vendorId]
    );
    const totalRoomUnits = (capacityResult as any[])[0].totalRoomUnits || 0;
    console.log(`Total room units: ${totalRoomUnits}`);
    
    // Calculate a simple occupancy rate based on current bookings
    // If we have bookings but no room units recorded, use a default value
    let occupancyRate = 0;
    
    if (totalRoomUnits > 0) {
      // Count active bookings (CONFIRMED, CHECKED_IN)
      const [activeBookingsResult] = await pool.query(
        `SELECT COUNT(*) as count
         FROM bookings b
         JOIN hotels h ON b.hotelId = h.id
         WHERE h.vendorId = ?
         AND b.status IN ('CONFIRMED', 'CHECKED_IN')
         AND CURDATE() BETWEEN b.checkInDate AND DATE_SUB(b.checkOutDate, INTERVAL 1 DAY)`,
        [vendorId]
      );
      
      const activeBookings = (activeBookingsResult as any[])[0].count || 0;
      occupancyRate = (activeBookings / totalRoomUnits) * 100;
      console.log(`Active bookings: ${activeBookings}, Occupancy rate: ${occupancyRate}%`);
    } else if (totalBookings > 0) {
      // If we have bookings but no room units, calculate a simple estimate
      occupancyRate = Math.min(totalBookings * 25, 100); // Estimate 25% per booking, capped at 100%
    }

    return NextResponse.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      checkedInBookings,
      cancelledBookings,
      totalRevenue,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to one decimal place
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking statistics' },
      { status: 500 }
    );
  }
}

// Helper function to determine date range based on timeframe
function getDateRangeFromTimeframe(timeframe: string): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate = new Date();
  const endDate = new Date(now);
  
  switch (timeframe) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate.setDate(0); // Last day of previous month
      break;
    case 'last_3_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'year_to_date':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
} 