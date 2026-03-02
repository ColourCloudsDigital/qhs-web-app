import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


/**
 * This endpoint should be called periodically (via cron job) to:
 * 1. Find all confirmed bookings where checkout date has passed
 * 2. Revert reserved room units back to available
 * 3. Update room availability counts
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from a trusted source (cron job)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();

    // Query for bookings that are CHECKED_OUT or where checkout date has passed
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings?status=CHECKED_OUT&sortBy=checkOutDate&order=asc`, {
      headers: {
        'X-Internal-Call': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    const { bookings } = await response.json();
    let processedCount = 0;

    // Process each booking where checkout date has passed
    for (const booking of bookings) {
      const checkOutDate = new Date(booking.checkOutDate);
      const processedFlag = booking.availabilityProcessed;

      // Only process if checkout date has passed and not yet processed
      if (checkOutDate < now && !processedFlag) {
        try {
          // Update room availability - revert units back to available
          const updateRes = await fetch(
            `/api/hotels/${booking.hotelId}/rooms/${booking.roomId}/availability`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Call': 'true',
              },
              body: JSON.stringify({
                action: 'restore',
                numberOfRooms: booking.numberOfRooms || 1,
                bookingId: booking.id,
              }),
            }
          );

          if (updateRes.ok) {
            processedCount++;
          }
        } catch (err) {
          console.error(`Failed to restore availability for booking ${booking.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} expired bookings`,
      processedCount,
    });

  } catch (err) {
    console.error('Availability expiry process error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
