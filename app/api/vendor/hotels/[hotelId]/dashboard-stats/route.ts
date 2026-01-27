import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { BookingStatus } from '@/lib/types/enums';
import { getUserVendorId } from '@/lib/utils/vendor';

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
    
    // Check if hotel belongs to the vendor
    if (session.user.role === 'VENDOR') {
      // Use the vendor utility to get vendor ID
      const { vendorId } = await getUserVendorId(session);
      
      if (!vendorId) {
        console.error('No vendor ID found for user:', session.user.id);
        return NextResponse.json(
          { error: 'Vendor not found' },
          { status: 404 }
        );
      }
      
      const [hotelRows] = await pool.query(`
        SELECT h.* FROM hotels h
        WHERE h.id = ? AND h.vendorId = ?
      `, [hotelId, vendorId]);
      
      if ((hotelRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Check if staff belongs to the hotel
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
    
    // Get current date for today's check-ins and check-outs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for MySQL
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get total rooms count
    const [roomCountRows] = await pool.query(`
      SELECT COUNT(*) as count FROM rooms
      WHERE hotelId = ?
    `, [hotelId]);
    
    const totalRooms = (roomCountRows as any[])[0]?.count || 0;
    
    // Parse room numbers to get physical room count
    const [roomRows] = await pool.query(`
      SELECT * FROM rooms
      WHERE hotelId = ?
    `, [hotelId]);
    
    let physicalRoomCount = 0;
    (roomRows as any[]).forEach(room => {
      try {
        // Try to use roomNumbers JSON field first (if available)
        if (room.roomNumbers) {
          let roomNumbersArray = room.roomNumbers;
          if (typeof room.roomNumbers === 'string') {
            roomNumbersArray = JSON.parse(room.roomNumbers);
          }
          if (Array.isArray(roomNumbersArray)) {
            physicalRoomCount += roomNumbersArray.length;
          } else {
            // If parsing fails, count the room itself
            physicalRoomCount += 1;
          }
        } else if (room.roomNumber) {
          // Fallback to roomNumber field if it exists
          physicalRoomCount += 1;
        } else {
          // If no room number data, just count the room itself
          physicalRoomCount += 1;
        }
      } catch (e) {
        console.error('Error processing room:', e);
        // Count the room anyway even if parsing fails
        physicalRoomCount += 1;
      }
    });
    
    // Get active bookings (checked in but not checked out)
    const [occupiedRows] = await pool.query(`
      SELECT COUNT(*) as count FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ? AND b.status = ?
    `, [hotelId, BookingStatus.CHECKED_IN]);
    
    const occupiedRoomsCount = (occupiedRows as any[])[0]?.count || 0;
    
    // Get total bookings
    const [totalBookingRows] = await pool.query(`
      SELECT COUNT(*) as count FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ?
    `, [hotelId]);
    
    const totalBookings = (totalBookingRows as any[])[0]?.count || 0;
    
    // Get today's check-ins
    const [checkInRows] = await pool.query(`
      SELECT COUNT(*) as count FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ? 
      AND DATE(b.checkInDate) = ?
      AND b.status IN (?, ?)
    `, [hotelId, todayStr, BookingStatus.CONFIRMED, BookingStatus.PENDING]);
    
    const todayCheckIns = (checkInRows as any[])[0]?.count || 0;
    
    // Get today's check-outs
    const [checkOutRows] = await pool.query(`
      SELECT COUNT(*) as count FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ?
      AND DATE(b.checkOutDate) = ?
      AND b.status = ?
    `, [hotelId, todayStr, BookingStatus.CHECKED_IN]);
    
    const todayCheckOuts = (checkOutRows as any[])[0]?.count || 0;
    
    // Get total revenue
    const [revenueRows] = await pool.query(`
      SELECT SUM(p.amount) as totalRevenue
      FROM payments p
      JOIN bookings b ON p.bookingId = b.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ?
    `, [hotelId]);
    
    const totalRevenue = (revenueRows as any[])[0]?.totalRevenue || 0;
    
    // Calculate occupancy rate
    const occupancyRate = physicalRoomCount > 0 
      ? Math.round((occupiedRoomsCount / physicalRoomCount) * 100) 
      : 0;
    
    return NextResponse.json({
      totalRooms: physicalRoomCount,
      occupiedRooms: occupiedRoomsCount,
      totalBookings,
      todayCheckIns,
      todayCheckOuts,
      totalRevenue,
      occupancyRate
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}