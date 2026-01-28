import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { bookingService } from '@/services/booking.service';
import { BookingStatus } from '@/lib/types/enums';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookingId = params.id;
    const { status, notes } = await request.json();

    // Validate status
    if (!Object.values(BookingStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid booking status' },
        { status: 400 }
      );
    }

    // Update booking status
    const success = await bookingService.updateBookingStatus(bookingId, status);

    if (!success) {
      return NextResponse.json(
        { error: 'Booking not found or update failed' },
        { status: 404 }
      );
    }

    // Get the updated booking to return current data
    const updatedBooking = await bookingService.getBookingById(bookingId);

    return NextResponse.json({
      id: bookingId,
      status: status,
      updatedAt: new Date().toISOString(),
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}