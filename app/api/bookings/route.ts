import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { availabilityService } from '@/lib/services/availability.service';
import { customerNotificationService } from '@/lib/services/customer-notification.service';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // Different behavior based on user role
    if (session.user.role === 'CUSTOMER' && session.user.customerId) {
      // Customers can only see their own bookings
      const [bookings] = await pool.query(
        `SELECT b.*, ru.roomNumber, r.name AS roomName, r.type as roomType
         FROM bookings b
         LEFT JOIN room_units ru ON b.roomUnitId = ru.id
         LEFT JOIN rooms r ON ru.roomId = r.id
         WHERE b.customerId = ?
         AND b.status IN ('CONFIRMED', 'PENDING')
         ORDER BY b.createdAt DESC
         LIMIT ?, ?`,
        [session.user.customerId, (page - 1) * limit, limit]
      );
      
      
      return NextResponse.json({ bookings });
    } else if (session.user.role === 'VENDOR' && session.user.vendorId) {
      // For vendors, require hotelId parameter
      const hotelId = searchParams.get('hotelId');
      
      if (!hotelId) {
        return NextResponse.json(
          { error: 'hotelId is required for vendor users' },
          { status: 400 }
        );
      }
      
      // Verify the hotel belongs to this vendor
      const [hotels] = await pool.query(
        'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
        [hotelId, session.user.vendorId]
      );
      
      if ((hotels as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or does not belong to this vendor' },
          { status: 404 }
        );
      }
      
      // Get bookings for this hotel
      const status = searchParams.get('status') || undefined;
      const statusFilter = status ? 
        `AND status IN (${status.split(',').map(s => `'${s.trim()}'`).join(',')})` : 
        '';
      
      const [bookings] = await pool.query(
        `SELECT * FROM bookings WHERE hotelId = ? ${statusFilter} LIMIT ?, ?`,
        [hotelId, (page - 1) * limit, limit]
      );
      
      return NextResponse.json({ bookings });
    } else if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN') {
      // Admin can see all bookings or filter by hotelId
      const hotelId = searchParams.get('hotelId');
      
      if (hotelId) {
        // Get bookings for specific hotel
        const [bookings] = await pool.query(
          `SELECT * FROM bookings WHERE hotelId = ? LIMIT ?, ?`,
          [hotelId, (page - 1) * limit, limit]
        );
        
        return NextResponse.json({ bookings });
      } else {
        // Get all bookings
        const [bookings] = await pool.query(
          `SELECT * FROM bookings LIMIT ?, ?`,
          [(page - 1) * limit, limit]
        );
        
        return NextResponse.json({ bookings });
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse booking data from request body
    const bookingData = await request.json();
    
    // Validate required fields
    const requiredFields = ['hotelId', 'roomId', 'customerId', 'checkInDate', 'checkOutDate', 'numberOfGuests'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // Handle numberOfRooms (default to 1)
    const numberOfRooms = bookingData.numberOfRooms ? parseInt(bookingData.numberOfRooms) : 1;
    if (numberOfRooms < 1) {
      return NextResponse.json({ error: 'Invalid number of rooms' }, { status: 400 });
    }
    
    // Begin transaction to handle the entire booking process
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check if room exists and has enough available units
      const [roomResults] = await connection.query(
        'SELECT * FROM rooms WHERE id = ? AND status = ?',
        [bookingData.roomId, 'available']
      );
      
      if ((roomResults as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Room not found or not available' }, { status: 400 });
      }
      
      // Find enough available room units
      const [availableUnits] = await connection.query(
        `SELECT * FROM room_units 
         WHERE roomId = ? AND status = 'available' 
         AND (currentBookingId IS NULL OR currentBookingId = '')
         LIMIT ?`,
        [bookingData.roomId, numberOfRooms]
      );
      
      if ((availableUnits as any[]).length < numberOfRooms) {
        await connection.rollback();
        return NextResponse.json({ error: 'Not enough available units for this room' }, { status: 400 });
      }
      
      // Calculate price
      const priceInfo = await availabilityService.calculateBookingPrice({
        roomId: bookingData.roomId,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
      });
      
      // Adjust total price for multiple rooms
      const totalAmount = priceInfo.totalPrice * numberOfRooms;
      
      // Generate a UUID for the booking
      const bookingId = uuidv4();
      
      // Set default values
      const status = 'CONFIRMED'; // Always confirm for guest bookings
      const paymentStatus = bookingData.paymentMethod === 'PAY_AT_HOTEL' ? 'PENDING' : 'PENDING';
      const specialRequests = bookingData.specialRequests || '';
      const paymentMethod = bookingData.paymentMethod || 'PAY_AT_HOTEL';
      
      // Select the first available room unit for the booking
      const selectedRoomUnit = (availableUnits as any[])[0];
      
      // Create booking in database (use roomUnitId instead of roomId)
      const query = `
        INSERT INTO bookings (
          id, hotelId, roomUnitId, customerId, checkInDate, checkOutDate, 
          numberOfGuests, numberOfRooms, totalAmount, status, paymentStatus, specialRequests,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.query(query, [
        bookingId,
        bookingData.hotelId,
        selectedRoomUnit.id, // Use room unit ID instead of room ID
        bookingData.customerId,
        bookingData.checkInDate,
        bookingData.checkOutDate,
        bookingData.numberOfGuests,
        numberOfRooms,
        totalAmount,
        status,
        paymentStatus,
        specialRequests
      ]);
      
      // Update the room_units status to reserved and set the currentBookingId
      for (const roomUnit of (availableUnits as any[])) {
        await connection.query(
          `UPDATE room_units SET status = 'reserved', currentBookingId = ? WHERE id = ?`,
          [bookingId, roomUnit.id]
        );
      }
      
      // If payment method is online payment, create payment record
      if (paymentMethod !== 'PAY_AT_HOTEL') {
        const paymentId = uuidv4();
        const paymentQuery = `
          INSERT INTO payments (
            id, bookingId, amount, status, paymentMethod, transactionId, 
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        await connection.query(paymentQuery, [
          paymentId,
          bookingId,
          totalAmount,
          'PENDING',
          paymentMethod,
          uuidv4().substring(0, 8)
        ]);
      }
      
      await connection.commit();
      
      // Send booking confirmation notification to customer
      try {
        // Get customer details for notification
        const [customerRows] = await pool.query(
          'SELECT userId, firstName, lastName FROM customers WHERE id = ?',
          [bookingData.customerId]
        );
        
        const customer = (customerRows as any[])[0];
        
        if (customer && customer.userId) {
          // Get hotel details for notification
          const [hotelRows] = await pool.query(
            'SELECT name FROM hotels WHERE id = ?',
            [bookingData.hotelId]
          );
          
          const hotel = (hotelRows as any[])[0];
          
          // Get room details for notification
          const [roomRows] = await pool.query(
            'SELECT r.name FROM rooms r JOIN room_units ru ON r.id = ru.roomId WHERE ru.id = ?',
            [selectedRoomUnit.id]
          );
          
          const room = (roomRows as any[])[0];
          
          await customerNotificationService.sendBookingNotification('confirmed', {
            bookingId,
            customerId: bookingData.customerId,
            userId: customer.userId,
            hotelName: hotel?.name || 'Hotel',
            roomName: room?.name || 'Room',
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            totalAmount,
            status
          });
        }
      } catch (notificationError) {
        console.error('Failed to send booking notification:', notificationError);
        // Don't fail the booking if notification fails
      }
      
      return NextResponse.json({
        success: true,
        id: bookingId,
        message: 'Booking created successfully',
        bookingDetails: {
          bookingId,
          totalAmount,
          nights: priceInfo.nights,
          paymentRequired: paymentMethod !== 'PAY_AT_HOTEL'
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}