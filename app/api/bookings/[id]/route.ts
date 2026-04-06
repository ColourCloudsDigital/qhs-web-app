import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { bookingService } from '@/lib/services/booking.service';
import { BookingStatus, PaymentStatus } from '@/lib/types/enums';
import pool from '@/lib/db';

// GET handler for retrieving a booking
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bookingId = params.id;
    let booking;
    try {
      booking = await bookingService.getBookingById(
      bookingId,
      true, // includeCustomer
      true, // includeHotel
      true  // includeRoom
    );
    } catch (err) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check authorization based on user role
    if (session.user.role === 'VENDOR') {
      // If vendor, check if booking is from their hotel
      const [vendorHotels] = await pool.query(
        `SELECT h.id FROM hotels h
         JOIN vendors v ON h.vendorId = v.id
         JOIN users u ON v.userId = u.id
         WHERE u.id = ?`,
        [session.user.id]
      );
      
      const hotelIds = (vendorHotels as any[]).map(hotel => hotel.id);
      
      if (!hotelIds.includes(booking.hotelId)) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'CUSTOMER') {
      // If customer, check if booking belongs to them
      const [customerResults] = await pool.query(
        `SELECT c.id FROM customers c
         JOIN users u ON c.userId = u.id
         WHERE u.id = ?`,
        [session.user.id]
      );
      
      if ((customerResults as any[]).length === 0 || (customerResults as any[])[0].id !== booking.customerId) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // If staff, check if booking is from their hotel
      const [staffHotels] = await pool.query(
        `SELECT hotelId FROM staff
         JOIN users ON staff.userId = users.id
         WHERE users.id = ?`,
        [session.user.id]
      );
      
      const hotelIds = (staffHotels as any[]).map(hotel => hotel.hotelId);
      
      if (!hotelIds.includes(booking.hotelId)) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }
    // Super admins and admins have access to all bookings
    
    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bookingId = params.id;
    const body = await request.json();
    
    // Validate required fields
    const { checkInDate, checkOutDate, numberOfGuests, specialRequests, totalAmount } = body;
    
    if (!checkInDate || !checkOutDate || !numberOfGuests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Format dates
    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);
    
    // Validate check-out is after check-in
    if (parsedCheckOut <= parsedCheckIn) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }
    
    // Get current booking to check authorization
    const currentBooking = await bookingService.getBookingById(
      bookingId,
      false,
      false,
      false
    );
    
    // Check authorization based on user role
    if (session.user.role === 'VENDOR') {
      // If vendor, check if booking is from their hotel
      const [vendorHotels] = await pool.query(
        `SELECT h.id FROM hotels h
         JOIN vendors v ON h.vendorId = v.id
         JOIN users u ON v.userId = u.id
         WHERE u.id = ?`,
        [session.user.id]
      );
      
      const hotelIds = (vendorHotels as any[]).map(hotel => hotel.id);
      
      if (!hotelIds.includes(currentBooking.hotelId)) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'CUSTOMER') {
      // If customer, check if booking belongs to them
      const [customerResults] = await pool.query(
        `SELECT c.id FROM customers c
         JOIN users u ON c.userId = u.id
         WHERE u.id = ?`,
        [session.user.id]
      );
      
      if ((customerResults as any[]).length === 0 || (customerResults as any[])[0].id !== currentBooking.customerId) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
      
      // Customers should only be able to update PENDING bookings
      if (currentBooking.status !== BookingStatus.PENDING) {
        return NextResponse.json(
          { error: 'Cannot modify a confirmed or completed booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // If staff, check if booking is from their hotel
      const [staffHotels] = await pool.query(
        `SELECT hotelId FROM staff
         JOIN users ON staff.userId = users.id
         WHERE users.id = ?`,
        [session.user.id]
      );
      
      const hotelIds = (staffHotels as any[]).map(hotel => hotel.hotelId);
      
      if (!hotelIds.includes(currentBooking.hotelId)) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }
    // Super admins and admins have access to all bookings
    
    // Check room availability for the new dates (if dates have changed)
    if (
      parsedCheckIn.toISOString() !== new Date(currentBooking.checkInDate).toISOString() ||
      parsedCheckOut.toISOString() !== new Date(currentBooking.checkOutDate).toISOString()
    ) {
      const isAvailable = await pool.query(`
        SELECT COUNT(*) as bookingCount
        FROM bookings
        WHERE roomUnitId = ?
        AND id != ?
        AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
        AND (
          (checkInDate <= ? AND checkOutDate > ?) OR
          (checkInDate >= ? AND checkInDate < ?)
        )
      `, [
        currentBooking.roomUnitId,
        bookingId,
        parsedCheckOut.toISOString().split('T')[0],
        parsedCheckIn.toISOString().split('T')[0],
        parsedCheckIn.toISOString().split('T')[0],
        parsedCheckOut.toISOString().split('T')[0]
      ]);
      
      const bookingCount = (isAvailable as any[])[0][0].bookingCount;
      
      if (bookingCount > 0) {
        return NextResponse.json(
          { error: 'Room is not available for the selected dates' },
          { status: 400 }
        );
      }
    }
    
    // Update booking in the database
    const [result] = await pool.query(`
      UPDATE bookings
      SET checkInDate = ?,
          checkOutDate = ?,
          numberOfGuests = ?,
          specialRequests = ?,
          ${totalAmount != null ? 'totalAmount = ?,' : ''}
          updatedAt = NOW()
      WHERE id = ?
    `, [
      parsedCheckIn.toISOString().split('T')[0],
      parsedCheckOut.toISOString().split('T')[0],
      numberOfGuests,
      specialRequests || '',
      ...(totalAmount != null ? [totalAmount] : []),
      bookingId
    ]);

    // Ensure room unit is marked as reserved/occupied when booking is active
    const activeStatuses = ['CONFIRMED', 'PENDING', 'CHECKED_IN'];
    if (activeStatuses.includes(currentBooking.status)) {
      const roomUnitStatus = currentBooking.status === 'CHECKED_IN' ? 'occupied' : 'reserved';
      await pool.query(
        `UPDATE room_units SET status = ?, currentBookingId = ?
         WHERE id = ? AND (currentBookingId = ? OR currentBookingId IS NULL OR currentBookingId = '')`,
        [roomUnitStatus, bookingId, currentBooking.roomUnitId, bookingId]
      );
    }
    
    // Get updated booking
    const updatedBooking = await bookingService.getBookingById(
      bookingId,
      true,
      true,
      true
    );
    
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const bookingId = params.id;
    
    // Only staff, vendors, or admins can update bookings
    if (
      session.user.role !== 'STAFF' && 
      session.user.role !== 'VENDOR' && 
      session.user.role !== 'SUPER_ADMIN' && 
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { status } = body;
    
    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }
    
    try {
      // Update booking status
      const updatedBooking = await bookingService.updateBookingStatus(
        bookingId,
        status,
        session.user.staffId // Staff ID if applicable
      );
      
      return NextResponse.json(updatedBooking);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Booking not found') {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}