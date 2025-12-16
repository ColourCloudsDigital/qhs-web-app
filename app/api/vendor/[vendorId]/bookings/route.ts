import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { bookingService } from '@/services/booking.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and authorized
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = params.vendorId;

    // Only allow if the user is a vendor with this ID or a super admin
    if (
      session.user.role !== 'SUPER_ADMIN' && 
      (session.user.role !== 'VENDOR' || session.user.vendorId !== vendorId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.has('page') ? parseInt(searchParams.get('page') as string) : 1;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const checkInDate = searchParams.get('checkInDate') 
      ? new Date(searchParams.get('checkInDate') as string) 
      : undefined;
    const checkOutDate = searchParams.get('checkOutDate') 
      ? new Date(searchParams.get('checkOutDate') as string) 
      : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const hotelId = searchParams.get('hotelId') || undefined;

    // Get bookings from service
    const bookingsData = await bookingService.getVendorBookings({
      vendorId,
      page,
      limit,
      status,
      search,
      checkInDate,
      checkOutDate,
      sortBy,
      sortOrder,
      hotelId,
    });

    return NextResponse.json(bookingsData);
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
} 