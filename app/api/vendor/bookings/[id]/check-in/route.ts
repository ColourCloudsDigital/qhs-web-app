import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { emailService } from '@/lib/services/email.service';
import { formatDate } from '@/lib/utils';
import { bookingService } from '@/services/booking.service';

export async function POST(
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
    
    // Only vendors and staff can check in guests
    if (
      session.user.role !== 'VENDOR' && 
      session.user.role !== 'STAFF' && 
      session.user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const bookingId = params.id;
    
    // Find the booking
    const booking = await bookingService.getBookingById(bookingId);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check if the booking can be checked in
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot check in a booking with status ${booking.status}` },
        { status: 400 }
      );
    }
    
    // Ensure the vendor has access to this hotel
    if (session.user.role === 'VENDOR') {
      // Get the vendor's hotels
      const [hotelResults] = await pool.query(
        `SELECT id FROM hotels WHERE vendorId = ?`,
        [session.user.vendorId]
      );
      
      const vendorHotels = (hotelResults as any[]).map(h => h.id);
      
      if (!vendorHotels.includes(booking.hotel.id)) {
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Get the staff member's assigned hotel
      const [staffResults] = await pool.query(
        `SELECT hotelId FROM staff WHERE userId = ?`,
        [session.user.id]
      );
      
      if (staffResults.length === 0 || (staffResults[0] as any).hotelId !== booking.hotel.id) {
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      idType, 
      idNumber, 
      issueKeycard = false, // Set to false as default since we're not using this feature yet
      sendWelcomeEmail = true,
      notes 
    } = body;
    
    // Validate ID information
    if (!idType || !idNumber) {
      return NextResponse.json(
        { error: 'ID information is required' },
        { status: 400 }
      );
    }
    
    // Update booking status
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update booking status
      await connection.query(
        `UPDATE bookings SET status = 'CHECKED_IN', updatedAt = NOW() WHERE id = ?`,
        [bookingId]
      );
      
      // Add check-in notes if provided
      if (notes) {
        // Get existing special requests
        const [specialRequestsResult] = await connection.query(
          `SELECT specialRequests FROM bookings WHERE id = ?`,
          [bookingId]
        );
        
        const existingRequests = (specialRequestsResult as any[])[0]?.specialRequests || '';
        const updatedRequests = existingRequests 
          ? `${existingRequests}\n\nCHECK-IN NOTES: ${notes}`
          : `CHECK-IN NOTES: ${notes}`;
        
        await connection.query(
          `UPDATE bookings SET specialRequests = ? WHERE id = ?`,
          [updatedRequests, bookingId]
        );
      }
      
      // Store ID verification information - just log it for now since this table doesn't exist in qaras.sql
      console.log('ID Verification:', {
        customerId: booking.customer.id,
        bookingId: booking.id,
        idType,
        idNumber,
        verifiedById: session.user.id,
        verifiedAt: new Date(),
      });
      
      // If we had a table for ID verification, we would use:
      /*
      await connection.query(
        `INSERT INTO id_verification (id, customerId, bookingId, idType, idNumber, verifiedById, verifiedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
        [booking.customer.id, booking.id, idType, idNumber, session.user.id]
      );
      */
      
      // Mark a room unit as occupied if applicable
      await connection.query(
        `UPDATE room_units 
         SET status = 'occupied', currentBookingId = ? 
         WHERE roomId = ? AND status = 'available' 
         LIMIT 1`,
        [bookingId, booking.room.id]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error during check-in transaction:', error);
      return NextResponse.json(
        { error: 'Failed to check in guest' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
    
    // Send welcome email if requested
    if (sendWelcomeEmail && booking.customer.email) {
      try {
        // Send welcome email with basic information
        await emailService.sendEmail({
          to: booking.customer.email,
          subject: `Welcome to ${booking.hotel.name}!`,
          text: `
Dear ${booking.customer.name},

Welcome to ${booking.hotel.name}! We're delighted to have you as our guest.

Your booking details:
- Check-in: ${formatDate(booking.checkInDate)}
- Check-out: ${formatDate(booking.checkOutDate)}
- Room: ${booking.room.name}

For any assistance during your stay, please contact our front desk.

We hope you enjoy your stay with us!

Warm regards,
The ${booking.hotel.name} Team
          `,
          html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Welcome to ${booking.hotel.name}!</h2>
  <p>Dear ${booking.customer.name},</p>
  <p>We're delighted to have you as our guest.</p>
  
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3>Your booking details:</h3>
    <ul>
      <li><strong>Check-in:</strong> ${formatDate(booking.checkInDate)}</li>
      <li><strong>Check-out:</strong> ${formatDate(booking.checkOutDate)}</li>
      <li><strong>Room:</strong> ${booking.room.name}</li>
    </ul>
  </div>
  
  <p>For any assistance during your stay, please contact our front desk.</p>
  <p>We hope you enjoy your stay with us!</p>
  
  <p>Warm regards,<br>The ${booking.hotel.name} Team</p>
</div>
          `
        });
      } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't fail the check-in if email fails
      }
    }
    
    // Get the updated booking
    const updatedBooking = await bookingService.getBookingById(bookingId);
    
    return NextResponse.json({
      success: true,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error checking in guest:', error);
    return NextResponse.json(
      { error: 'Failed to check in guest' },
      { status: 500 }
    );
  }
}