import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';


/**
 * GET /api/staff/hotels
 * Retrieves hotels that the staff member has access to
 * A staff member might be assigned to a specific hotel or have access to all hotels owned by their vendor
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a staff member
    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Get staff record with vendor and hotel information
    const [staffRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.id as staffId,
        s.vendorId,
        s.hotelId,
        s.position,
        s.permissions
      FROM staff s
      WHERE s.userId = ?`,
      [userId]
    );
    
    if (staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }
    
    const staff = staffRows[0];
    let hotels: any[] = [];
    
    // If staff is assigned to a specific hotel, return only that hotel
    if (staff.hotelId) {
      const [hotelRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          h.id,
          h.name,
          h.description,
          h.address,
          h.city,
          h.state,
          h.country,
          h.zipCode,
          h.phone,
          h.email,
          h.website,
          h.images,
          h.rating,
          h.isActive
        FROM hotels h
        WHERE h.id = ? AND h.isActive = 1`,
        [staff.hotelId]
      );
      
      if (hotelRows.length > 0) {
        hotels = hotelRows.map(hotel => formatHotel(hotel));
      }
    } 
    // Otherwise, return all hotels owned by the vendor
    else if (staff.vendorId) {
      const [hotelRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          h.id,
          h.name,
          h.description,
          h.address,
          h.city,
          h.state,
          h.country,
          h.zipCode,
          h.phone,
          h.email,
          h.website,
          h.images,
          h.rating,
          h.isActive
        FROM hotels h
        WHERE h.vendorId = ? AND h.isActive = 1
        ORDER BY h.name ASC`,
        [staff.vendorId]
      );
      
      hotels = hotelRows.map(hotel => formatHotel(hotel));
    }
    
    return NextResponse.json({ 
      hotels: hotels,
      count: hotels.length,
      staffInfo: {
        id: staff.staffId,
        vendorId: staff.vendorId,
        hotelId: staff.hotelId,
        position: staff.position,
        permissions: staff.permissions ? JSON.parse(staff.permissions) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching staff hotels:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching hotels' },
      { status: 500 }
    );
  }
}

// Helper function to format hotel data
function formatHotel(hotel: any) {
  return {
    id: hotel.id,
    name: hotel.name,
    description: hotel.description,
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    country: hotel.country,
    zipCode: hotel.zipCode,
    phone: hotel.phone,
    email: hotel.email,
    website: hotel.website,
    rating: hotel.rating,
    isActive: hotel.isActive,
    // Parse images JSON string to array if stored as string
    images: hotel.images ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images) : []
  };
}
