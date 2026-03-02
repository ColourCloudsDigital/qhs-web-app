import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HotelService } from '@/services/hotels';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor, staff, or admin)
    if (session.user.role !== UserRole.VENDOR && 
        session.user.role !== UserRole.STAFF && 
        session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Check for impersonation token
    const impersonationToken = req.cookies.get('impersonation_token');
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    
    // Handle simple flag for dropdown lists
    const simple = searchParams.get('simple') === 'true';
    
    // If vendor or super admin impersonating a vendor, only show their hotels
    let vendorId = undefined;
    if (session.user.role === UserRole.VENDOR) {
      vendorId = session.user.vendorId;
      
      if (!vendorId) {
        console.error('Vendor session missing vendorId', session);
        return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
      }
    }
    
    // If super admin is impersonating, let them see all hotels
    // In a real implementation, we would verify the impersonation token and get the vendorId
    // For this fix, we'll allow super admins to see all hotels when impersonating
    if (session.user.role === UserRole.SUPER_ADMIN && impersonationToken) {
      // vendorId remains undefined, so all hotels will be returned
      console.log('Super admin impersonating - showing all hotels');
    }
    
    // If staff, only show their assigned hotel
    if (session.user.role === UserRole.STAFF) {
      const staffId = session.user.staffId;
      
      if (!staffId) {
        console.error('Staff session missing staffId', session);
        return NextResponse.json({ error: 'Invalid staff session' }, { status: 403 });
      }
      
      // Get the staff's assigned hotel
      const [staffRows] = await pool.query(
        'SELECT hotelId FROM staff WHERE id = ?',
        [staffId]
      );
      
      const staff = (staffRows as any[])[0];
      
      if (staff && staff.hotelId) {
        // For staff, just return this one hotel
        const [hotelRows] = await pool.query(
          `SELECT id, name, city, state, country, images, isActive 
           FROM hotels WHERE id = ?`,
          [staff.hotelId]
        );
        
        const hotel = (hotelRows as any[])[0];
        
        if (hotel) {
          // Format the hotel data
          const formattedHotel = {
            ...hotel,
            images: hotel.images ? JSON.parse(hotel.images as string) : [],
          };
          
          return NextResponse.json({
            hotels: [formattedHotel],
            total: 1,
            page: 1,
            pageSize: 1,
            totalPages: 1,
          });
        }
      }
      
      // If staff has no assigned hotel, return empty list
      return NextResponse.json({
        hotels: [],
        total: 0,
        page: 1,
        pageSize: pageSize,
        totalPages: 0,
      });
    }
    
    // Get hotels with filters
    const hotels = await HotelService.getHotels({
      page,
      pageSize,
      sortColumn: 'createdAt',
      sortDirection: 'desc',
      filters: {
        search,
        vendorId,
      },
      simple,
    });
    
    return NextResponse.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization (must be vendor or admin)
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    
    // If vendor, ensure they're creating a hotel for themselves
    if (session.user.role === UserRole.VENDOR) {
      // Set vendorId to the logged-in vendor's ID
      data.vendorId = session.user.vendorId;
      
      if (!data.vendorId) {
        console.error('Vendor session missing vendorId', session);
        return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
      }
    }
    
    // Validate required fields
    if (!data.name || !data.city || !data.country || !data.vendorId) {
      return NextResponse.json(
        { error: 'Required fields are missing: name, city, country, vendorId' },
        { status: 400 }
      );
    }
    
    // Create hotel
    const hotel = await HotelService.createHotel(data);
    
    return NextResponse.json({ hotel }, { status: 201 });
  } catch (error) {
    console.error('Error creating hotel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create hotel' },
      { status: 500 }
    );
  }
}
