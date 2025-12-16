import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { BookingStatus } from '@/lib/types/enums';

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
    
    // Only vendors, staff, and admins can search bookings
    if (
      session.user.role !== 'VENDOR' && 
      session.user.role !== 'STAFF' && 
      session.user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const hotelId = params.hotelId;
    
    // Check permission
    if (session.user.role === 'VENDOR') {
      // Check if the hotel belongs to the vendor
      const [hotelResult] = await pool.query(
        `SELECT h.id FROM hotels h 
         JOIN vendors v ON h.vendorId = v.id
         JOIN users u ON v.userId = u.id
         WHERE h.id = ? AND u.id = ?`,
        [hotelId, session.user.id]
      );
      
      if ((hotelResult as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Check if the staff is assigned to this hotel
      const [staffResult] = await pool.query(
        `SELECT s.id FROM staff s
         WHERE s.userId = ? AND s.hotelId = ?`,
        [session.user.id, hotelId]
      );
      
      if ((staffResult as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
    }
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const statusParam = searchParams.get('status');
    
    // Build the SQL query
    let sqlQuery = `
      SELECT 
        b.id, b.checkInDate, b.checkOutDate, b.totalAmount, b.status, b.paymentStatus,
        c.id as customerId, c.firstName, c.lastName, c.phone,
        u.name as userName, u.email as userEmail,
        r.id as roomId, r.name as roomName, r.roomNumbers
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.hotelId = ?
    `;
    
    const queryParams: any[] = [hotelId];
    
    // Apply status filter if provided
    if (statusParam) {
      sqlQuery += ` AND b.status = ?`;
      queryParams.push(statusParam);
    }
    
    // Apply search filter
    if (query && query.length >= 3) {
      sqlQuery += ` AND (
        b.id LIKE ? OR
        COALESCE(u.name, '') LIKE ? OR
        COALESCE(u.email, '') LIKE ? OR
        COALESCE(c.firstName, '') LIKE ? OR
        COALESCE(c.lastName, '') LIKE ? OR
        COALESCE(c.phone, '') LIKE ?
      )`;
      const searchPattern = `%${query}%`;
      queryParams.push(
        searchPattern, 
        searchPattern, 
        searchPattern, 
        searchPattern, 
        searchPattern, 
        searchPattern
      );
    }
    
    // Add order by and limit
    sqlQuery += ` ORDER BY b.checkInDate ASC LIMIT 10`;
    
    // Execute the query
    const [bookingsResult] = await pool.query(sqlQuery, queryParams);
    const bookings = bookingsResult as any[];
    
    // Format results
    const formattedBookings = bookings.map(booking => {
      // Extract room number
      let roomNumber = '';
      if (booking.roomNumbers) {
        try {
          const roomNumbers = JSON.parse(booking.roomNumbers);
          roomNumber = roomNumbers[0] || booking.roomName;
        } catch (e) {
          console.error('Error parsing room numbers:', e);
          roomNumber = booking.roomName;
        }
      } else {
        roomNumber = booking.roomName;
      }

      // Use customer name from user if available, otherwise use firstName + lastName
      const customerName = booking.userName || 
        [booking.firstName, booking.lastName].filter(Boolean).join(' ') || 
        'Guest';
      
      return {
        id: booking.id,
        customerName: customerName,
        customerEmail: booking.userEmail || 'No email provided',
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomNumber,
        totalAmount: parseFloat(booking.totalAmount),
        status: booking.status,
        paymentStatus: booking.paymentStatus
      };
    });
    
    return NextResponse.json({
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Error searching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to search bookings' },
      { status: 500 }
    );
  }
}