import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { bookingService } from '@/lib/services/booking.service';
import { BookingStatus } from '@/lib/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;

    // Only allow the logged-in customer to access their own bookings
    // or admins/super admins
    const isCustomerOwnAccount =
      session.user.role === 'CUSTOMER' &&
      session.user.customerId &&
      session.user.customerId === customerId;

    const isAdmin =
      session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN';

    if (!isCustomerOwnAccount && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.has('page')
      ? parseInt(searchParams.get('page') as string, 10)
      : 1;
    const limit = searchParams.has('limit')
      ? parseInt(searchParams.get('limit') as string, 10)
      : 10;
    const statusParam = searchParams.get('status') || undefined;

    const status = statusParam as BookingStatus | undefined;

    const result = await bookingService.getCustomerBookings(customerId, {
      page,
      limit,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}


