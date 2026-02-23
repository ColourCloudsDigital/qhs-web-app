import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import { HotelService } from '@/services/hotels';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET a specific hotel by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;

    try {
      // First get the hotel basic info
      const [hotelRows] = await pool.query(
        `SELECT h.*, u.name as vendorName
         FROM hotels h
         LEFT JOIN vendors v ON h.vendorId = v.id
         LEFT JOIN users u ON v.userId = u.id
         WHERE h.id = ?`,
        [hotelId]
      ) as [RowDataPacket[], any];

      if (hotelRows.length === 0) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      const hotel = hotelRows[0];

      // Get amenities
      const [amenitiesRows] = await pool.query(
        `SELECT a.* 
         FROM amenities a
         JOIN hotel_amenities ha ON a.id = ha.amenityId
         WHERE ha.hotelId = ?`,
        [hotelId]
      ) as [RowDataPacket[], any];

      // Get rooms - Fixed query to remove the join with non-existent room_types table
      const [roomsRows] = await pool.query(
        `SELECT r.* 
         FROM rooms r
         WHERE r.hotelId = ?`,
        [hotelId]
      ) as [RowDataPacket[], any];

      // Process data
      // Parse JSON fields
      const formattedHotel = {
        ...hotel,
        images: hotel.images ? (() => {
          try {
            return JSON.parse(hotel.images);
          } catch (e) {
            return [];
          }
        })() : [],
        // Default config values if columns don't exist in DB
        whitelabelConfig: hotel.whitelabelConfig ? (() => {
          try {
            return JSON.parse(hotel.whitelabelConfig);
          } catch (e) {
            return null;
          }
        })() : {
          logo: null,
          primaryColor: "#1e3a8a",
          secondaryColor: "#f59e0b",
          fontFamily: "Poppins, sans-serif"
        },
        status: hotel.status || 'ACTIVE',
        rating: typeof hotel.rating === 'number' ? hotel.rating : 
               (hotel.rating ? parseFloat(hotel.rating) : 0),
        amenities: amenitiesRows,
        rooms: roomsRows.map((room: any) => ({
          ...room,
          images: room.images ? (() => {
            try {
              return JSON.parse(room.images);
            } catch (e) {
              return [];
            }
          })() : [],
          roomNumber: room.roomNumber || room.room_number || '',
          roomTypeName: room.type || 'Standard Room', // Use the type field directly instead of roomTypeName
          type: room.type || '',
          status: (() => {
            const statusValue = (room.status || 'available').toLowerCase();
            if (['available', 'vacant'].includes(statusValue)) return 'available';
            if (['occupied', 'booked'].includes(statusValue)) return 'occupied';
            if (['maintenance', 'under_maintenance'].includes(statusValue)) return 'maintenance';
            if (['cleaning', 'housekeeping'].includes(statusValue)) return 'cleaning';
            return statusValue;
          })(),
          bookingCount: 0,
          pricePerNight: room.price
        })),
        vendor: {
          id: hotel.vendorId,
          name: hotel.vendorName || 'Unknown'
        }
      };

      return NextResponse.json({ hotel: formattedHotel });
    } catch (err) {
      console.error('Error fetching hotel with direct MySQL:', err);
      throw err;
    }
  } catch (error) {
    console.error('Error in hotel API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel' },
      { status: 500 }
    );
  }
}

// PUT to update a hotel
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;
    const body = await req.json();

    try {
      const hotel = await HotelService.updateHotel(hotelId, body);
      return NextResponse.json({ hotel });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Hotel not found') {
          return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
        }
        if (err.message === 'Vendor not found') {
          return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        if (err.message.includes('cannot be empty')) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error updating hotel:', error);
    return NextResponse.json(
      { error: 'Failed to update hotel' },
      { status: 500 }
    );
  }
}

// DELETE a hotel
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication - only super admin can delete hotels
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;

    try {
      await HotelService.deleteHotel(hotelId);
      return NextResponse.json(
        { message: 'Hotel deleted successfully' },
        { status: 200 }
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Hotel not found') {
          return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error deleting hotel:', error);
    return NextResponse.json(
      { error: 'Failed to delete hotel' },
      { status: 500 }
    );
  }
}