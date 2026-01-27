import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Record<string, string> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;

    // Verify hotel exists
    const [hotelRows]: any = await pool.query(
      'SELECT id, name FROM hotels WHERE id = ?',
      [hotelId]
    );

    if (hotelRows.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Get rooms for this hotel with availability count
    const [rows]: any = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.type,
        r.capacity,
        r.pricePerNight,
        r.status,
        COUNT(ru.id) as total_units,
        COUNT(CASE WHEN ru.status = 'available' THEN 1 END) as available_units
      FROM rooms r
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ? AND r.status = 'available'
      GROUP BY r.id, r.name, r.type, r.capacity, r.pricePerNight, r.status
      HAVING available_units > 0
      ORDER BY r.name
    `, [hotelId]);

    // For each room, fetch amenities safely
    const roomsWithAmenities = await Promise.all(
      rows.map(async (room: any) => {
        try {
          const [amenityRows]: any = await pool.query(
            `SELECT
              a.id,
              a.name,
              a.description,
              a.icon
            FROM room_amenities ra
            JOIN amenities a ON ra.amenityId = a.id
            WHERE ra.roomId = ?`,
            [room.id]
          );

        return {
          id: room.id,
          name: room.name,
          type: room.type,
          status: room.status,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          availableUnits: room.available_units,
          totalUnits: room.total_units,
          available: room.available_units > 0,
          amenities: amenityRows || []
        };
        } catch (amenityError) {
          // If amenities fail to load, continue without them
          console.warn('Failed to load amenities for room:', room.id, amenityError);
          return {
            id: room.id,
            name: room.name,
            type: room.type,
            status: room.status,
            capacity: room.capacity,
            pricePerNight: room.pricePerNight,
            availableUnits: room.available_units,
            totalUnits: room.total_units,
            available: room.available_units > 0,
            amenities: []
          };
        }
      })
    );

    return NextResponse.json(roomsWithAmenities);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available rooms' },
      { status: 500 }
    );
  }
}
