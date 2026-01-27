import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { availabilityService } from '@/lib/services/availability.service';
import { customerNotificationService } from '@/lib/services/customer-notification.service';
import { emailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    // Parse guest booking data from request body
    const bookingData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone',
      'hotelId', 'roomId', 'checkInDate', 'checkOutDate', 'numberOfGuests'
    ];
    
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Begin transaction to handle the entire guest booking process
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      let userId = null;
      let customerId = null;
      
      // Check if user already exists by email
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [bookingData.email]
      );
      
      if ((existingUsers as any[]).length > 0) {
        // User exists, get their customer record
        userId = (existingUsers as any[])[0].id;
        
        const [existingCustomers] = await connection.query(
          'SELECT id FROM customers WHERE userId = ?',
          [userId]
        );
        
        if ((existingCustomers as any[]).length > 0) {
          customerId = (existingCustomers as any[])[0].id;
        } else {
          // User exists but no customer record, create customer
          customerId = uuidv4();
          await connection.query(
            `INSERT INTO customers (id, userId, firstName, lastName, phone, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [customerId, userId, bookingData.firstName, bookingData.lastName, bookingData.phone]
          );
        }
      } else {
        // Create new user and customer
        userId = uuidv4();
        customerId = uuidv4();
        
        // Generate a temporary password for the guest user
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        // Create user record
        await connection.query(
          `INSERT INTO users (id, email, password, role, emailVerified, createdAt, updatedAt)
           VALUES (?, ?, ?, 'CUSTOMER', 0, NOW(), NOW())`,
          [userId, bookingData.email, hashedPassword]
        );
        
        // Create customer record
        await connection.query(
          `INSERT INTO customers (id, userId, firstName, lastName, phone, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [customerId, userId, bookingData.firstName, bookingData.lastName, bookingData.phone]
        );
      }
      
      // Check if room exists and is available
      const [roomResults] = await connection.query(
        'SELECT * FROM rooms WHERE id = ? AND status = ?',
        [bookingData.roomId, 'available']
      );
      
      if ((roomResults as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Room not found or not available' }, { status: 400 });
      }
      
      const room = (roomResults as any[])[0];
      
      // Check room availability for the selected dates
      const isAvailable = await availabilityService.checkRoomAvailability({
        roomId: bookingData.roomId,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
      });
      
      if (!isAvailable) {
        await connection.rollback();
        return NextResponse.json({ error: 'Room is not available for the selected dates' }, { status: 400 });
      }
      
      // Find available room unit
      const [availableUnits] = await connection.query(
        `SELECT * FROM room_units 
         WHERE roomId = ? AND status = 'available' 
         AND (currentBookingId IS NULL OR currentBookingId = '')
         LIMIT 1`,
        [bookingData.roomId]
      );
      
      if ((availableUnits as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'No available units for this room' }, { status: 400 });
      }
      
      // Calculate price
      const priceInfo = await availabilityService.calculateBookingPrice({
        roomId: bookingData.roomId,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
      });
      
      // Generate booking ID
      const bookingId = uuidv4();
      
      // Set default values
      const status = 'CONFIRMED';
      const paymentStatus = bookingData.paymentMethod === 'PAY_AT_HOTEL' ? 'PENDING' : 'PENDING';
      const specialRequests = bookingData.specialRequests || '';
      const paymentMethod = bookingData.paymentMethod || 'PAY_AT_HOTEL';
      
      // Create booking in database
      const bookingQuery = `
        INSERT INTO bookings (
          id, hotelId, roomId, customerId, checkInDate, checkOutDate, 
          numberOfGuests, numberOfRooms, totalAmount, status, paymentStatus, specialRequests,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.query(bookingQuery, [
        bookingId,
        bookingData.hotelId,
        bookingData.roomId,
        customerId,
        bookingData.checkInDate,
        bookingData.checkOutDate,
        bookingData.numberOfGuests,
        1, // numberOfRooms defaults to 1 for guest bookings
        priceInfo.totalPrice,
        status,
        paymentStatus,
        specialRequests
      ]);
      
      // Update room unit status
      const roomUnit = (availableUnits as any[])[0];
      await connection.query(
        `UPDATE room_units SET status = 'reserved', currentBookingId = ? WHERE id = ?`,
        [bookingId, roomUnit.id]
      );
      
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
          priceInfo.totalPrice,
          'PENDING',
          paymentMethod,
          uuidv4().substring(0, 8)
        ]);
      }
      
      await connection.commit();
      
      // Send booking confirmation notification and email
      try {
        // Get hotel details for notification and email
        const [hotelRows] = await pool.query(
          'SELECT name, address, phone, email, vendorId FROM hotels WHERE id = ?',
          [bookingData.hotelId]
        );
        
        const hotel = (hotelRows as any[])[0];
        
        // Send notification through customer notification service
        await customerNotificationService.sendBookingNotification('confirmed', {
          bookingId,
          customerId,
          userId,
          hotelName: hotel?.name || 'Hotel',
          roomName: room?.name || 'Room',
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          totalAmount: priceInfo.totalPrice,
          status
        });
        
        // Send booking confirmation email
        await emailService.sendBookingConfirmation({
          to: bookingData.email,
          guestName: `${bookingData.firstName} ${bookingData.lastName}`,
          bookingDetails: {
            id: bookingId,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            roomType: room.type || 'Standard Room',
            numberOfGuests: bookingData.numberOfGuests,
            totalAmount: priceInfo.totalPrice,
            paymentStatus
          },
          hotelDetails: {
            name: hotel?.name || 'Hotel',
            address: hotel?.address || '',
            phone: hotel?.phone || '',
            email: hotel?.email || '',
            currency: 'NGN'
          },
          vendorId: hotel?.vendorId
        });
        
      } catch (notificationError) {
        console.error('Failed to send booking confirmation:', notificationError);
        // Don't fail the booking if notification/email fails
      }
      
      return NextResponse.json({
        success: true,
        id: bookingId,
        message: 'Booking created successfully',
        bookingDetails: {
          bookingId,
          totalAmount: priceInfo.totalPrice,
          nights: priceInfo.nights,
          paymentRequired: paymentMethod !== 'PAY_AT_HOTEL',
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          hotelName: hotel?.name || 'Hotel',
          roomName: room?.name || 'Room'
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error creating guest booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create booking', 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}