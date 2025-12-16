import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
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

    const { roomId } = params;

    // Verify room belongs to vendor's hotel
    const [roomRows]: any = await pool.query(
      `SELECT r.id 
       FROM rooms r 
       JOIN hotels h ON r.hotelId = h.id 
       WHERE r.id = ? AND h.vendorId = ?`,
      [roomId, vendorId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    // Fetch all amenities and mark the ones associated with this room
    const [rows]: any = await pool.query(
      `SELECT 
        a.*,
        CASE WHEN ra.roomId IS NOT NULL THEN 1 ELSE 0 END as isEnabled
      FROM amenities a
      LEFT JOIN room_amenities ra ON a.id = ra.amenityId AND ra.roomId = ?
      WHERE a.isActive = 1 AND a.category = 'ROOM'
      ORDER BY a.name ASC`,
      [roomId]
    );

    return NextResponse.json(rows.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      description: amenity.description,
      icon: amenity.icon,
      isEnabled: Boolean(amenity.isEnabled)
    })));
  } catch (error) {
    console.error('Error fetching room amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room amenities' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
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

    const { roomId } = params;
    const { amenityIds } = await request.json();

    if (!Array.isArray(amenityIds)) {
      return NextResponse.json(
        { error: 'Invalid amenity IDs provided' },
        { status: 400 }
      );
    }

    // Verify room belongs to vendor's hotel
    const [roomRows]: any = await pool.query(
      `SELECT r.id 
       FROM rooms r 
       JOIN hotels h ON r.hotelId = h.id 
       WHERE r.id = ? AND h.vendorId = ?`,
      [roomId, vendorId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Remove all existing amenities for this room
      await connection.query(
        'DELETE FROM room_amenities WHERE roomId = ?',
        [roomId]
      );

      // Add new amenities
      if (amenityIds.length > 0) {
        const values = amenityIds.map((amenityId: string) => [roomId, amenityId]);
        await connection.query(
          'INSERT INTO room_amenities (roomId, amenityId) VALUES ?',
          [values]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Room amenities updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating room amenities:', error);
    return NextResponse.json(
      { error: 'Failed to update room amenities' },
      { status: 500 }
    );
  }
} 