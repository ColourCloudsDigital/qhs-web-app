import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import { HotelService } from '@/services/hotels';

// GET handler to fetch hotels with pagination, sorting, and filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Hotels API - Session:", session?.user);

    // Check authentication - allow both SUPER_ADMIN and ADMIN roles
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== 'ADMIN')) {
      console.log("Hotels API - Unauthorized - User role:", session?.user?.role);
      return NextResponse.json({ error: 'Unauthorized - Requires SUPER_ADMIN or ADMIN role' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortColumn = searchParams.get('sortColumn') || 'createdAt';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const simple = searchParams.get('simple') === 'true';
    const vendorId = searchParams.get('vendorId') || undefined;
    
    console.log("Hotels API - Request params:", { simple, page, pageSize, search, vendorId });
    
    // Set up filters
    const filters = {
      search,
      vendorId
    };
    
    // Use the service to fetch hotels
    const result = await HotelService.getHotels({
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
      simple
    });

    console.log("Hotels API - Response:", simple ? `${result.hotels?.length || 0} hotels returned` : `${result.hotels?.length || 0} hotels, ${result.total || 0} total`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST handler to create a new hotel
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication - only super admin can create hotels
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    
    try {
      // Use service to create hotel
      const hotel = await HotelService.createHotel(body);
      return NextResponse.json({ hotel }, { status: 201 });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('required fields')) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        if (err.message === 'Vendor not found') {
          return NextResponse.json({ error: err.message }, { status: 404 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error creating hotel:', error);
    return NextResponse.json(
      { error: 'Failed to create hotel' },
      { status: 500 }
    );
  }
}