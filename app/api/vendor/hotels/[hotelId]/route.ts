import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { HotelService } from '@/services/hotels';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function GET(
  request: Request,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
      if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotelId } = params;

    // Fetch hotel details
    const [rows]: any = await pool.query(
      `SELECT 
        h.*,
        COUNT(DISTINCT r.id) as totalRooms,
        COUNT(DISTINCT ru.id) as totalUnits,
        SUM(CASE WHEN ru.status = 'available' THEN 1 ELSE 0 END) as availableUnits
      FROM hotels h
      LEFT JOIN rooms r ON h.id = r.hotelId
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE h.id = ? AND h.vendorId = ?
      GROUP BY h.id`,
      [hotelId, vendorId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found or unauthorized' },
        { status: 404 }
      );
    }

    const hotel = rows[0];

    // Fetch amenities for the hotel
    const [amenityRows]: any = await pool.query(
      `SELECT 
        a.id,
        a.name,
        a.description,
        a.icon
         FROM hotel_amenities ha
         JOIN amenities a ON ha.amenityId = a.id
         WHERE ha.hotelId = ?`,
        [hotelId]
      );
      
    // Fetch policies for the hotel
    const [policyRows]: any = await pool.query(
      `SELECT 
        id,
        type,
        description,
        isActive
      FROM hotel_policies
      WHERE hotelId = ?
      ORDER BY type ASC`,
        [hotelId]
      );
      
    // Fetch room types for the hotel
    const [roomTypeRows]: any = await pool.query(
      `SELECT DISTINCT
        rt.id,
        rt.name,
        rt.description,
        rt.basePrice,
        COUNT(r.id) as roomCount
      FROM room_types rt
      JOIN rooms r ON r.roomTypeId = rt.id
      WHERE r.hotelId = ?
      GROUP BY rt.id`,
      [hotelId]
    );

    // Fetch current occupancy stats
    const [statsRows]: any = await pool.query(
      `SELECT
        COUNT(DISTINCT b.id) as activeBookings,
        SUM(CASE WHEN b.status = 'CHECKED_IN' THEN 1 ELSE 0 END) as currentGuests,
        COUNT(DISTINCT CASE WHEN ru.status = 'occupied' THEN ru.id END) as occupiedRooms,
        COUNT(DISTINCT CASE WHEN ru.status = 'maintenance' THEN ru.id END) as maintenanceRooms
      FROM hotels h
      LEFT JOIN rooms r ON h.id = r.hotelId
      LEFT JOIN room_units ru ON r.id = ru.roomId
      LEFT JOIN bookings b ON ru.currentBookingId = b.id
      WHERE h.id = ? AND b.status NOT IN ('CANCELED', 'COMPLETED')`,
      [hotelId]
    );

      return NextResponse.json({ 
      ...hotel,
      amenities: amenityRows,
      policies: policyRows,
      roomTypes: roomTypeRows,
      stats: statsRows[0]
    });
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const hotelId = params.hotelId;
    const userRole = session.user.role;
    
    // First, check if hotel exists using direct SQL query
    const [hotels] = await pool.query('SELECT * FROM hotels WHERE id = ? LIMIT 1', [hotelId]);
    
    if (!hotels || (hotels as any[]).length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    
    // SUPER_ADMIN can update any hotel
    if (userRole !== UserRole.SUPER_ADMIN) {
      // For VENDOR role, check they own this hotel
      if (userRole === UserRole.VENDOR) {
        const vendorId = session.user.vendorId;
        
        if (!vendorId) {
          console.error('Vendor session missing vendorId', { 
            session, 
            userRole, 
            vendorId: session.user.vendorId 
          });
          return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
        }
        
        // Check if the hotel belongs to this vendor using direct query
        const [vendorHotels] = await pool.query('SELECT id FROM hotels WHERE vendorId = ?', [vendorId]);
      
        if (!vendorHotels || (vendorHotels as any[]).length === 0) {
          return NextResponse.json({ error: 'You do not have access to any hotels' }, { status: 403 });
        }
        
        const hotelIds = (vendorHotels as any[]).map((h: any) => String(h.id));
        
        if (!hotelIds.includes(String(hotelId))) {
          console.log(`Permission check failed: Hotel ID ${hotelId} not in vendor's hotels [${hotelIds.join(', ')}]`);
          return NextResponse.json({ error: 'You do not have permission to update this hotel' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Only vendors and admins can update hotels' }, { status: 403 });
      }
    }
    
    // Parse request body
    const data = await req.json();
    
    // Log the received data for debugging
    console.log('Updating hotel with data:', {
      id: hotelId,
      ...data,
      amenities: data.amenities ? `${data.amenities.length} amenities` : undefined,
      images: data.images ? `${data.images.length} images` : undefined
    });
    
    // Update hotel
    const updatedHotel = await HotelService.updateHotel(hotelId, data);
    
    return NextResponse.json({ hotel: updatedHotel });
  } catch (error) {
    console.error('Error updating hotel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update hotel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const hotelId = params.hotelId;
    const userRole = session.user.role;
    
    // First, check if hotel exists using direct SQL query
    const [hotels] = await pool.query('SELECT * FROM hotels WHERE id = ? LIMIT 1', [hotelId]);
    
    if (!hotels || (hotels as any[]).length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    
    // SUPER_ADMIN can delete any hotel
    if (userRole !== UserRole.SUPER_ADMIN) {
      // For VENDOR role, check they own this hotel
      if (userRole === UserRole.VENDOR) {
        const vendorId = session.user.vendorId;
        
        if (!vendorId) {
          console.error('Vendor session missing vendorId', session);
          return NextResponse.json({ error: 'Invalid vendor session' }, { status: 403 });
        }
        
        // Check if the hotel belongs to this vendor using direct query
        const [vendorHotels] = await pool.query('SELECT id FROM hotels WHERE vendorId = ?', [vendorId]);
      
        if (!vendorHotels || (vendorHotels as any[]).length === 0) {
          return NextResponse.json({ error: 'You do not have access to any hotels' }, { status: 403 });
        }
        
        const hotelIds = (vendorHotels as any[]).map((h: any) => String(h.id));
        
        if (!hotelIds.includes(String(hotelId))) {
          console.log(`Permission check failed: Hotel ID ${hotelId} not in vendor's hotels [${hotelIds.join(', ')}]`);
          return NextResponse.json({ error: 'You do not have permission to delete this hotel' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Only vendors and admins can delete hotels' }, { status: 403 });
      }
    }
    
    // Check if hotel has active bookings using direct query
    const [bookings] = await pool.query(
      `SELECT id FROM bookings 
       WHERE hotelId = ? 
       AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN') 
       LIMIT 1`,
      [hotelId]
    );
    
    if (bookings && (bookings as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete hotel with active bookings' },
        { status: 400 }
      );
    }
    
    // Delete the hotel using HotelService
    await HotelService.deleteHotel(hotelId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete hotel' },
      { status: 500 }
    );
  }
}