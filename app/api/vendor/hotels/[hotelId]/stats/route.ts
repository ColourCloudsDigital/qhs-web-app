import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HotelService } from '@/services/hotels';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { hotelId: string } }
) {
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
    
    const hotelId = params.hotelId;
    
    // For VENDOR role, make sure they own this hotel
    if (session.user.role === UserRole.VENDOR) {
      const vendorId = session.user.vendorId;
      
      if (!vendorId) {
        console.error('Vendor session missing vendorId', { 
          session, 
          userRole: session.user.role, 
          vendorId: session.user.vendorId 
        });
        return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
      }
      
      // Check if the hotel belongs to this vendor using direct query
      const [vendorHotels] = await pool.query('SELECT id FROM hotels WHERE vendorId = ?', [vendorId]);
      
      if (!vendorHotels || (vendorHotels as any[]).length === 0) {
        return NextResponse.json({ error: 'You do not have access to any hotels' }, { status: 403 });
      }
      
      const vendorHotelIds = (vendorHotels as any[]).map((h: any) => String(h.id));
      if (!vendorHotelIds.includes(String(hotelId))) {
        console.log(`Permission check failed: Hotel ID ${hotelId} not in vendor's hotels [${vendorHotelIds.join(', ')}]`);
        return NextResponse.json({ error: 'You do not have permission to access this hotel' }, { status: 403 });
      }
    }
    
    // Get hotel stats using MySQL instead of Prisma
    try {
      // 1. Count rooms
      const [roomCountResults] = await pool.query(
        'SELECT COUNT(*) as count FROM rooms WHERE hotelId = ?',
        [hotelId]
      );
      
      const roomCount = (roomCountResults as any[])[0].count;
      
      // Count physical rooms (from roomNumbers field)
      const [roomResults] = await pool.query(
        'SELECT roomNumbers FROM rooms WHERE hotelId = ?',
        [hotelId]
      );
      
      let physicalRoomCount = 0;
      (roomResults as any[]).forEach(room => {
        // If room has roomNumbers field (array in JSON)
        if (room.roomNumbers) {
          try {
            const roomNumbers = typeof room.roomNumbers === 'string'
              ? JSON.parse(room.roomNumbers)
              : room.roomNumbers;
              
            if (Array.isArray(roomNumbers)) {
              physicalRoomCount += roomNumbers.length;
            }
          } catch (e) {
            console.error('Error parsing room numbers:', e);
          }
        } 
        // If no roomNumbers field, count as 1 room
        else {
          physicalRoomCount += 1;
        }
      });
      
      // 2. Count bookings
      const [bookingCountResults] = await pool.query(
        'SELECT COUNT(*) as count FROM bookings WHERE hotelId = ?',
        [hotelId]
      );
      
      const bookingCount = (bookingCountResults as any[])[0].count;
      
      // 3. Calculate revenue
      const [paymentResults] = await pool.query(
        `SELECT p.amount 
         FROM payments p
         JOIN bookings b ON p.bookingId = b.id
         WHERE b.hotelId = ?`,
        [hotelId]
      );
      
      const totalRevenue = (paymentResults as any[]).reduce((sum, payment) => 
        sum + (parseFloat(payment.amount) || 0), 0);
      
      // 4. Calculate occupancy rate (simplified)
      const today = new Date().toISOString().split('T')[0];
      
      const [activeBookingResults] = await pool.query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE hotelId = ? 
         AND status IN ('CONFIRMED', 'CHECKED_IN')
         AND checkInDate <= ?
         AND checkOutDate >= ?`,
        [hotelId, today, today]
      );
      
      const activeBookings = (activeBookingResults as any[])[0].count;
      
      const occupancyRate = physicalRoomCount > 0 
        ? Math.round((activeBookings / physicalRoomCount) * 100) 
        : 0;
      
      return NextResponse.json({
        roomCount,
        physicalRoomCount,
        bookingCount,
        revenue: totalRevenue,
        occupancyRate,
      });
    } catch (error) {
      console.error('Error fetching hotel stats:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch hotel stats',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching hotel stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hotel stats' },
      { status: 500 }
    );
  }
}