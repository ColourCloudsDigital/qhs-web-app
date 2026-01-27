import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { staffNotificationService } from '@/lib/services/staff-notification.service';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookingData = await request.json();
    
    // Validate required fields
    const requiredFields = ['hotelId', 'roomUnitId', 'guestFirstName', 'guestPhone', 'checkInDate', 'checkOutDate', 'numberOfGuests'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Verify staff has access to this hotel
    const [staffResults] = await pool.query(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = (staffResults as any[])[0];
    if (staff.hotelId !== bookingData.hotelId) {
      return NextResponse.json(
        { error: `Unauthorized to create bookings for this hotel. Staff hotel: ${staff.hotelId}, Requested hotel: ${bookingData.hotelId}` },
        { status: 403 }
      );
    }

    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if customer exists or use provided customerId
      let customerId = bookingData.customerId;
      
      if (!customerId) {
        // Check if customer exists by phone number
        const [existingCustomers] = await connection.query(
          'SELECT id FROM customers WHERE phone = ?',
          [bookingData.guestPhone]
        );

        if ((existingCustomers as any[]).length > 0) {
          customerId = (existingCustomers as any[])[0].id;
          
          // Update customer info if needed
          await connection.query(
            'UPDATE customers SET firstName = ?, lastName = ?, email = ?, nationality = ?, idType = ?, idNumber = ?, updatedAt = NOW() WHERE id = ?',
            [
              bookingData.guestFirstName, 
              bookingData.guestLastName || '', 
              bookingData.guestEmail || null,
              bookingData.guestNationality || null,
              bookingData.guestIdType || null,
              bookingData.guestIdNumber || null,
              customerId
            ]
          );
        } else {
          // Create new customer
          customerId = uuidv4();
          await connection.query(
            `INSERT INTO customers (id, firstName, lastName, phone, email, nationality, idType, idNumber, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              customerId, 
              bookingData.guestFirstName, 
              bookingData.guestLastName || '', 
              bookingData.guestPhone,
              bookingData.guestEmail || null,
              bookingData.guestNationality || null,
              bookingData.guestIdType || null,
              bookingData.guestIdNumber || null
            ]
          );
        }
      }

      // Check room unit and get room details
      const [roomUnitResults] = await connection.query(
        `SELECT ru.*, r.* FROM room_units ru 
         JOIN rooms r ON ru.roomId = r.id 
         WHERE ru.id = ? AND r.hotelId = ? AND r.status = 'available'`,
        [bookingData.roomUnitId, bookingData.hotelId]
      );

      if ((roomUnitResults as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Room unit not found or room not available' }, { status: 400 });
      }

      const roomUnit = (roomUnitResults as any[])[0];

      // Check for date conflicts with existing bookings on this specific room unit
      const checkInDate = bookingData.checkInDate;
      const checkOutDate = bookingData.checkOutDate;

      const [conflictingBookings] = await connection.query(
        `SELECT b.id, b.status, b.checkInDate, b.checkOutDate, ru.roomNumber
         FROM bookings b
         JOIN room_units ru ON b.roomUnitId = ru.id
         WHERE b.roomUnitId = ? 
         AND b.status NOT IN ('CANCELED', 'CANCELLED', 'CHECKED_OUT', 'COMPLETED')
         AND (
           (b.checkInDate <= ? AND b.checkOutDate > ?)
           OR (b.checkInDate < ? AND b.checkOutDate >= ?)
           OR (b.checkInDate >= ? AND b.checkOutDate <= ?)
         )`,
        [
          bookingData.roomUnitId,
          checkOutDate, checkInDate,  // Existing booking starts before/on checkout and ends after checkin
          checkOutDate, checkOutDate, // Existing booking starts before checkout and ends after/on checkout
          checkInDate, checkOutDate   // Existing booking is completely within the requested period
        ]
      );

      if ((conflictingBookings as any[]).length > 0) {
        const conflict = (conflictingBookings as any[])[0];
        await connection.rollback();
        return NextResponse.json({ 
          error: `Room unit ${conflict.roomNumber} is not available for the selected dates. It has a ${conflict.status.toLowerCase()} booking from ${conflict.checkInDate} to ${conflict.checkOutDate}.` 
        }, { status: 400 });
      }

      // Generate booking ID
      const bookingId = uuidv4();

      // Calculate payment status
      const totalAmount = bookingData.totalAmount;
      const depositAmount = bookingData.depositAmount || 0;
      let paymentStatus = 'PENDING';
      
      if (depositAmount >= totalAmount) {
        paymentStatus = 'PAID';
      } else if (depositAmount > 0) {
        paymentStatus = 'PARTIAL';
      }

      // Create booking with roomUnitId
      const bookingQuery = `
        INSERT INTO bookings (
          id, hotelId, roomUnitId, customerId, checkInDate, checkOutDate, 
          numberOfGuests, totalAmount, status, paymentStatus, specialRequests,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await connection.query(bookingQuery, [
        bookingId,
        bookingData.hotelId,
        bookingData.roomUnitId,
        customerId,
        bookingData.checkInDate,
        bookingData.checkOutDate,
        bookingData.numberOfGuests,
        totalAmount,
        'CONFIRMED', // Staff bookings are automatically confirmed
        paymentStatus,
        bookingData.specialRequests || ''
      ]);

      // Update room unit status
      await connection.query(
        `UPDATE room_units SET status = 'reserved', updatedAt = NOW() WHERE id = ?`,
        [roomUnit.id]
      );

      // Create payment record if deposit was made
      if (depositAmount > 0) {
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
          depositAmount,
          'COMPLETED',
          bookingData.paymentMethod || 'CASH',
          uuidv4().substring(0, 8)
        ]);
      }

      await connection.commit();

      // Send notification about new booking
      try {
        await staffNotificationService.notifyBookingCreated({
          id: bookingId,
          customerName: `${bookingData.guestFirstName} ${bookingData.guestLastName || ''}`.trim(),
          roomNumber: roomUnit.roomNumber,
          hotelId: bookingData.hotelId
        }, session.user.id);
      } catch (notificationError) {
        console.error('Failed to send booking creation notification:', notificationError);
        // Don't fail the request if notification fails
      }

      return NextResponse.json({
        bookingId,
        customerId,
        roomUnitId: roomUnit.id,
        roomNumber: roomUnit.roomNumber,
        totalAmount,
        depositAmount,
        paymentStatus,
        message: 'Walk-in booking created successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating walk-in booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}