import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

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
    
    const staffId = session.user.staffId;
    
    // Verify staff ID exists
    if (!staffId) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }
    
    // Get staff with related data
    const staff = await prisma.staff.findUnique({
      where: { 
        id: staffId 
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            country: true,
            images: true,
            isActive: true,
          }
        },
        vendor: {
          include: {
            hotels: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                country: true,
                images: true,
              },
              orderBy: {
                name: 'asc',
              }
            }
          }
        }
      }
    });
    
    if (!staff) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
    }
    
    let hotels = [];
    
    // If staff is assigned to a specific hotel, return only that hotel
    if (staff.hotel && staff.hotel.isActive) {
      hotels = [formatHotel(staff.hotel)];
    } 
    // Otherwise, return all hotels owned by the vendor
    else if (staff.vendor) {
      hotels = staff.vendor.hotels.map(hotel => formatHotel(hotel));
    }
    
    return NextResponse.json({ 
      hotels: hotels,
      count: hotels.length
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
    ...hotel,
    // Parse images JSON string to array if stored as string
    images: typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images
  };
}