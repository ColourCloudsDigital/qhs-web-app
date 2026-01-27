import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { UserRole, BookingStatus } from '@/lib/types/enums';
import NotificationService from '@/lib/services/notification.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    console.log('[API] Processing check-in for booking:', params.bookingId);
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors and staff can check in guests
    if (
      session.user.role !== UserRole.VENDOR && 
      session.user.role !== UserRole.STAFF && 
      session.user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      idType,
      idNumber,
      issueKeycard = true,
      sendWelcomeEmail = true,
      notes = ''
    } = body;
    
    // Validate required fields
    if (!idType || !idNumber.trim()) {
      return NextResponse.json(
        { error: 'ID type and number are required' },
        { status: 400 }
      );
    }
    
    // Get booking details
    const [bookingRows] = await pool.query(
      `SELECT 
        b.*,
        c.firstName,
        c.lastName,
        c.phone,
        u.email,
        ru.roomNumber,
        r.name as roomName,
        h.name as hotelName
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      JOIN hotels h ON b.hotelId = h.id
      WHERE b.id = ?`,
      [params.bookingId]
    );
    
    const bookings = bookingRows as any[];
    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    const booking = bookings[0];
    
    // Check if booking is in correct status for check-in
    if (booking.status !== BookingStatus.CONFIRMED) {
      return NextResponse.json(
        { error: `Cannot check in booking with status: ${booking.status}` },
        { status: 400 }
      );
    }
    
    // Check if check-in date is today or in the past
    const today = new Date();
    const checkInDate = new Date(booking.checkInDate);
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    
    if (checkInDate > today) {
      return NextResponse.json(
        { error: 'Cannot check in before the scheduled check-in date' },
        { status: 400 }
      );
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update booking status to checked in
      await connection.query(
        `UPDATE bookings 
         SET status = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [BookingStatus.CHECKED_IN, params.bookingId]
      );
      
      // Update customer ID information
      await connection.query(
        `UPDATE customers 
         SET idType = ?, idNumber = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [idType, idNumber, booking.customerId]
      );
      
      // Update room unit status to occupied
      await connection.query(
        `UPDATE room_units 
         SET status = 'occupied', currentBookingId = ? 
         WHERE id = ?`,
        [params.bookingId, booking.roomUnitId]
      );
      
      // If issuing keycard, find an available keycard and assign it
      if (issueKeycard) {
        const [availableKeycards] = await connection.query(
          `SELECT id FROM keycards 
           WHERE hotelId = ? AND isActive = 1 AND assignedToId IS NULL 
           LIMIT 1`,
          [booking.hotelId]
        );
        
        if ((availableKeycards as any[]).length > 0) {
          const keycard = (availableKeycards as any[])[0];
          await connection.query(
            `UPDATE keycards 
             SET assignedToId = ?, validFrom = NOW(), validTo = ? 
             WHERE id = ?`,
            [params.bookingId, booking.checkOutDate, keycard.id]
          );
          
          console.log(`[API] Assigned keycard ${keycard.id} to booking ${params.bookingId}`);
        }
      }
      
      // Create check-in log entry (if you have a logs table)
      try {
        await connection.query(
          `INSERT INTO booking_logs (bookingId, action, performedBy, notes, createdAt) 
           VALUES (?, 'CHECK_IN', ?, ?, NOW())`,
          [params.bookingId, session.user.id, notes || 'Guest checked in']
        );
      } catch (logError) {
        // Log error but don't fail the check-in
        console.warn('[API] Failed to create check-in log:', logError);
      }
      
      // Commit transaction
      await connection.commit();
      
      console.log(`[API] Successfully checked in booking ${params.bookingId}`);
      
      // Create notification for successful check-in
      try {
        const customerName = `${booking.firstName} ${booking.lastName || ''}`.trim();
        await NotificationService.notifyBookingCheckedIn(
          session.user.id,
          params.bookingId,
          customerName,
          booking.roomNumber,
          session.user.id
        );
        
        // Also notify hotel staff if this is a vendor check-in
        if (session.user.role === UserRole.VENDOR) {
          const hotelStaff = await NotificationService.getHotelStaff(booking.hotelId);
          if (hotelStaff.length > 0) {
            await NotificationService.createBulkNotifications(
              hotelStaff,
              {
                title: 'Guest Checked In',
                content: `${customerName} has been checked in to room ${booking.roomNumber} by vendor`,
                type: 'BOOKING',
                senderId: session.user.id,
                metadata: {
                  bookingId: params.bookingId,
                  action: 'checked_in',
                  entityType: 'booking'
                }
              }
            );
          }
        }
      } catch (notificationError) {
        console.error('[API] Failed to create check-in notification:', notificationError);
        // Don't fail the check-in if notification fails
      }
      
      // TODO: Send welcome email if requested
      if (sendWelcomeEmail && booking.email) {
        // Implement email sending logic here
        console.log(`[API] Would send welcome email to ${booking.email}`);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Guest checked in successfully',
        booking: {
          id: params.bookingId,
          customerName: `${booking.firstName} ${booking.lastName || ''}`.trim(),
          roomNumber: booking.roomNumber,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: BookingStatus.CHECKED_IN
        }
      });
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('[API] Error checking in guest:', error);
    return NextResponse.json(
      { error: 'Failed to check in guest' },
      { status: 500 }
    );
  }
}