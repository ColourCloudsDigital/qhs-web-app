import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automatedCheckoutService } from '@/lib/services/automated-checkout.service';
import { UserRole } from '@/lib/types/enums';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/bookings/[id]/checkout
 * Manually checkout a specific booking
 * Can be used by hotel staff or automated systems
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: bookingId } = params;

    // Get session for authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to checkout bookings
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // For vendors and staff, verify they have access to this booking
    if (session.user.role === UserRole.VENDOR || session.user.role === UserRole.STAFF) {
      // This would require additional validation to ensure the booking belongs to their hotel
      // For now, we'll allow it but this should be implemented based on your access control needs
    }

    console.log(`Processing manual checkout for booking ${bookingId} by user ${session.user.email}`);
    
    const success = await automatedCheckoutService.processSpecificBooking(bookingId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Booking checked out successfully',
        bookingId
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to checkout booking' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error checking out booking ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to checkout booking',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}