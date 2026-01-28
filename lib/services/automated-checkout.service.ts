import pool from '@/lib/db';
import { BookingStatus } from '@/lib/types/enums';
import { customerNotificationService } from './customer-notification.service';
import { emailService } from './email.service';

export interface AutoCheckoutResult {
  processedBookings: number;
  freedRoomUnits: number;
  errors: string[];
}

export const automatedCheckoutService = {
  /**
   * Process all bookings that have passed their checkout date
   * This should be run periodically (e.g., every hour or daily)
   */
  async processExpiredBookings(): Promise<AutoCheckoutResult> {
    const connection = await pool.getConnection();
    const result: AutoCheckoutResult = {
      processedBookings: 0,
      freedRoomUnits: 0,
      errors: []
    };

    try {
      await connection.beginTransaction();

      // Find all bookings that should be automatically checked out
      // Criteria: checkOutDate has passed AND status is CHECKED_IN or CONFIRMED
      const [expiredBookings] = await connection.query(`
        SELECT 
          b.id,
          b.checkOutDate,
          b.status,
          b.customerId,
          b.hotelId,
          b.roomUnitId,
          b.totalAmount,
          c.userId,
          c.firstName,
          c.lastName,
          h.name as hotelName,
          r.name as roomName
        FROM bookings b
        JOIN customers c ON b.customerId = c.id
        JOIN hotels h ON b.hotelId = h.id
        JOIN room_units ru ON b.roomUnitId = ru.id
        JOIN rooms r ON ru.roomId = r.id
        WHERE b.checkOutDate < CURDATE()
          AND b.status IN ('CHECKED_IN', 'CONFIRMED')
        ORDER BY b.checkOutDate ASC
      `);

      const bookingsToProcess = expiredBookings as any[];
      
      console.log(`Found ${bookingsToProcess.length} expired bookings to process`);

      for (const booking of bookingsToProcess) {
        try {
          // Update booking status to CHECKED_OUT
          await connection.query(
            'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
            [BookingStatus.CHECKED_OUT, booking.id]
          );

          // Free up room units associated with this booking
          const [roomUnitsResult] = await connection.query(
            `UPDATE room_units 
             SET status = 'available', 
                 currentBookingId = NULL, 
                 lastCleanedAt = NOW(),
                 updatedAt = NOW()
             WHERE currentBookingId = ?`,
            [booking.id]
          );

          const freedUnits = (roomUnitsResult as any).affectedRows;
          result.freedRoomUnits += freedUnits;

          console.log(`Processed booking ${booking.id}: freed ${freedUnits} room units`);

          // Send checkout notification to customer
          if (booking.userId) {
            try {
              await customerNotificationService.sendBookingNotification('checked_out', {
                bookingId: booking.id,
                customerId: booking.customerId,
                userId: booking.userId,
                hotelName: booking.hotelName,
                roomName: booking.roomName,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                totalAmount: booking.totalAmount,
                status: BookingStatus.CHECKED_OUT
              });

              // Send checkout confirmation email
              await this.sendAutomatedCheckoutEmail(booking);
            } catch (notificationError) {
              console.error(`Failed to send checkout notification for booking ${booking.id}:`, notificationError);
              result.errors.push(`Notification failed for booking ${booking.id}: ${notificationError.message}`);
            }
          }

          result.processedBookings++;
        } catch (bookingError) {
          console.error(`Failed to process booking ${booking.id}:`, bookingError);
          result.errors.push(`Failed to process booking ${booking.id}: ${bookingError.message}`);
        }
      }

      await connection.commit();
      
      console.log(`Automated checkout completed: ${result.processedBookings} bookings processed, ${result.freedRoomUnits} room units freed`);
      
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('Error in automated checkout process:', error);
      result.errors.push(`Transaction failed: ${error.message}`);
      return result;
    } finally {
      connection.release();
    }
  },

  /**
   * Process a specific booking for checkout
   */
  async processSpecificBooking(bookingId: string): Promise<boolean> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get booking details
      const [bookingRows] = await connection.query(`
        SELECT 
          b.*,
          c.userId,
          c.firstName,
          c.lastName,
          h.name as hotelName,
          r.name as roomName
        FROM bookings b
        JOIN customers c ON b.customerId = c.id
        JOIN hotels h ON b.hotelId = h.id
        JOIN room_units ru ON b.roomUnitId = ru.id
        JOIN rooms r ON ru.roomId = r.id
        WHERE b.id = ?
      `, [bookingId]);

      if ((bookingRows as any[]).length === 0) {
        throw new Error('Booking not found');
      }

      const booking = (bookingRows as any[])[0];

      // Check if booking can be checked out
      if (booking.status === BookingStatus.CHECKED_OUT) {
        throw new Error('Booking is already checked out');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new Error('Cannot checkout a cancelled booking');
      }

      // Update booking status
      await connection.query(
        'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
        [BookingStatus.CHECKED_OUT, bookingId]
      );

      // Free up room units
      await connection.query(
        `UPDATE room_units 
         SET status = 'available', 
             currentBookingId = NULL, 
             lastCleanedAt = NOW(),
             updatedAt = NOW()
         WHERE currentBookingId = ?`,
        [bookingId]
      );

      await connection.commit();

      // Send notifications
      if (booking.userId) {
        try {
          await customerNotificationService.sendBookingNotification('checked_out', {
            bookingId: booking.id,
            customerId: booking.customerId,
            userId: booking.userId,
            hotelName: booking.hotelName,
            roomName: booking.roomName,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            totalAmount: booking.totalAmount,
            status: BookingStatus.CHECKED_OUT
          });

          await this.sendAutomatedCheckoutEmail(booking);
        } catch (notificationError) {
          console.error(`Failed to send checkout notification for booking ${bookingId}:`, notificationError);
        }
      }

      return true;
    } catch (error) {
      await connection.rollback();
      console.error(`Error checking out booking ${bookingId}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Get statistics about expired bookings
   */
  async getExpiredBookingsStats(): Promise<{
    expiredCount: number;
    expiredBookings: any[];
    roomUnitsToFree: number;
  }> {
    const [expiredBookings] = await pool.query(`
      SELECT 
        b.id,
        b.checkOutDate,
        b.status,
        b.totalAmount,
        h.name as hotelName,
        r.name as roomName,
        c.firstName,
        c.lastName,
        (SELECT COUNT(*) FROM room_units WHERE currentBookingId = b.id) as roomUnitsCount
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      JOIN hotels h ON b.hotelId = h.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE b.checkOutDate < CURDATE()
        AND b.status IN ('CHECKED_IN', 'CONFIRMED')
      ORDER BY b.checkOutDate ASC
    `);

    const bookings = expiredBookings as any[];
    const roomUnitsToFree = bookings.reduce((total, booking) => total + booking.roomUnitsCount, 0);

    return {
      expiredCount: bookings.length,
      expiredBookings: bookings,
      roomUnitsToFree
    };
  },

  /**
   * Send automated checkout email
   */
  async sendAutomatedCheckoutEmail(booking: any): Promise<void> {
    try {
      // Get customer email
      const [userRows] = await pool.query(
        'SELECT email FROM users WHERE id = ?',
        [booking.userId]
      );

      if ((userRows as any[]).length === 0) {
        throw new Error('User email not found');
      }

      const userEmail = (userRows as any[])[0].email;

      // Get hotel details for email
      const [hotelRows] = await pool.query(
        'SELECT name, address, phone, email as hotelEmail FROM hotels WHERE id = ?',
        [booking.hotelId]
      );

      const hotel = (hotelRows as any[])[0];

      await emailService.sendBookingConfirmation({
        to: userEmail,
        guestName: `${booking.firstName} ${booking.lastName}`,
        bookingDetails: {
          id: booking.id,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          roomType: booking.roomName,
          numberOfGuests: booking.numberOfGuests,
          totalAmount: booking.totalAmount,
          paymentStatus: 'COMPLETED',
          status: 'CHECKED_OUT'
        },
        hotelDetails: {
          name: hotel?.name || 'Hotel',
          address: hotel?.address || '',
          phone: hotel?.phone || '',
          email: hotel?.hotelEmail || '',
          currency: 'NGN'
        },
        isCheckoutConfirmation: true
      });
    } catch (error) {
      console.error('Failed to send automated checkout email:', error);
      throw error;
    }
  },

  /**
   * Clean up old checked-out bookings (optional maintenance)
   * This can be used to archive or clean up very old bookings
   */
  async cleanupOldBookings(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [result] = await pool.query(`
      UPDATE bookings 
      SET status = 'ARCHIVED' 
      WHERE status = 'CHECKED_OUT' 
        AND checkOutDate < ? 
        AND updatedAt < ?
    `, [cutoffDate, cutoffDate]);

    return (result as any).affectedRows;
  }
};