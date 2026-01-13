import { NextRequest, NextResponse } from 'next/server';
import { automatedCheckoutService } from '@/lib/services/automated-checkout.service';

/**
 * POST /api/bookings/automated-checkout
 * Process expired bookings and free up room units
 * This endpoint can be called by cron jobs or scheduled tasks
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (for cron job security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting automated checkout process...');
    
    const result = await automatedCheckoutService.processExpiredBookings();
    
    return NextResponse.json({
      success: true,
      message: 'Automated checkout completed',
      result: {
        processedBookings: result.processedBookings,
        freedRoomUnits: result.freedRoomUnits,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error in automated checkout API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process automated checkout',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/automated-checkout
 * Get statistics about expired bookings that need processing
 */
export async function GET(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await automatedCheckoutService.getExpiredBookingsStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting expired bookings stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get expired bookings stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}