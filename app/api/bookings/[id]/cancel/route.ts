import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { bookingService } from '@/lib/services/booking.service';

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
    
    const bookingId = params.id;
    
    // Parse request body
    const body = await request.json();
    const { reason } = body;
    
    // Validate required fields
    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }
    
    try {
      // First get the booking to check permissions
      const booking = await bookingService.getBookingById(bookingId);
      
      // Determine who is cancelling the booking
      let cancelledBy: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
      if (session.user.role === 'CUSTOMER') {
        // Customer can only cancel their own bookings
        if (booking.customerId !== session.user.customerId) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 403 }
          );
        }
        cancelledBy = 'CUSTOMER';
      } else if (
        session.user.role === 'VENDOR' || 
        session.user.role === 'STAFF'
      ) {
        // Verify that vendor/staff is associated with the hotel
        // This would require additional checks with hotel data
        cancelledBy = 'VENDOR';
      } else if (
        session.user.role === 'SUPER_ADMIN' || 
        session.user.role === 'ADMIN'
      ) {
        cancelledBy = 'ADMIN';
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      // Cancel the booking
      const cancelledBooking = await bookingService.cancelBooking(
        bookingId,
        reason,
        cancelledBy
      );
      
      // Fetch booking to get room and hotel info
      const bookingRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}`
      );
      const bookingData = await bookingRes.json();

      // Restore room availability
      try {
        await fetch(
          `/api/hotels/${bookingData.hotelId}/rooms/${bookingData.roomId}/availability`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'restore',
              numberOfRooms: bookingData.numberOfRooms || 1,
              bookingId: bookingData.id,
            }),
          }
        );
      } catch (err) {
        console.error('Failed to restore availability:', err);
        // Don't fail the cancellation if availability update fails
      }

      return NextResponse.json(cancelledBooking);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Booking not found') {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        } else if (
          err.message === 'Booking is already cancelled' ||
          err.message === 'Cannot cancel a booking that has already checked in or checked out'
        ) {
          return NextResponse.json(
            { error: err.message },
            { status: 400 }
          );
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}