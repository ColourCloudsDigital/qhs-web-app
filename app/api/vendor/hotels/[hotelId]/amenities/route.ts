import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Verify hotel belongs to vendor
    const [hotelRows]: any = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
      [hotelId, vendorId]
    );

    if (hotelRows.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found or unauthorized' },
        { status: 404 }
      );
    }

    // Fetch all amenities and mark the ones associated with this hotel
    const [rows]: any = await pool.query(
      `SELECT 
        a.*,
        CASE WHEN ha.hotelId IS NOT NULL THEN 1 ELSE 0 END as isEnabled
      FROM amenities a
      LEFT JOIN hotel_amenities ha ON a.id = ha.amenityId AND ha.hotelId = ?
      WHERE a.isActive = 1
      ORDER BY a.category ASC, a.name ASC`,
      [hotelId]
    );

    // Group amenities by category
    const groupedAmenities = rows.reduce((acc: any, amenity: any) => {
      const category = amenity.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        icon: amenity.icon,
        isEnabled: Boolean(amenity.isEnabled)
      });
      return acc;
    }, {});

    return NextResponse.json(groupedAmenities);
  } catch (error) {
    console.error('Error fetching hotel amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel amenities' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { amenityIds } = await request.json();

    if (!Array.isArray(amenityIds)) {
      return NextResponse.json(
        { error: 'Invalid amenity IDs provided' },
        { status: 400 }
      );
    }

    // Verify hotel belongs to vendor
    const [hotelRows]: any = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
      [hotelId, vendorId]
    );

    if (hotelRows.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found or unauthorized' },
        { status: 404 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Remove all existing amenities for this hotel
      await connection.query(
        'DELETE FROM hotel_amenities WHERE hotelId = ?',
        [hotelId]
      );

      // Add new amenities
      if (amenityIds.length > 0) {
        const values = amenityIds.map((amenityId: string) => [hotelId, amenityId]);
        await connection.query(
          'INSERT INTO hotel_amenities (hotelId, amenityId) VALUES ?',
          [values]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Hotel amenities updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating hotel amenities:', error);
    return NextResponse.json(
      { error: 'Failed to update hotel amenities' },
      { status: 500 }
    );
  }
} 