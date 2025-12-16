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

    const roomId = params.roomId;

    // Fetch room details including available units
    const [rows]: any = await pool.query(
      `SELECT 
        r.*,
        rt.name as roomTypeName,
        rt.description as roomTypeDescription,
        rt.basePrice as roomTypeBasePrice,
        COUNT(ru.id) as totalUnits,
        SUM(CASE WHEN ru.status = 'available' THEN 1 ELSE 0 END) as availableUnits
      FROM rooms r
      LEFT JOIN room_types rt ON r.roomTypeId = rt.id
      LEFT JOIN room_units ru ON r.id = ru.roomId
      JOIN hotels h ON r.hotelId = h.id
      WHERE r.id = ? AND h.vendorId = ?
      GROUP BY r.id`,
      [roomId, vendorId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    const room = rows[0];

    // Fetch amenities for the room
    const [amenityRows]: any = await pool.query(
      `SELECT 
        a.id,
        a.name,
        a.description,
        a.icon
      FROM room_amenities ra
      JOIN amenities a ON ra.amenityId = a.id
      WHERE ra.roomId = ?`,
      [roomId]
    );

    // Fetch pricing rules for the room
    const [pricingRows]: any = await pool.query(
      `SELECT 
        id,
        startDate,
        endDate,
        priceAdjustment,
        adjustmentType,
        description
      FROM room_pricing_rules
      WHERE roomId = ? AND isActive = 1
      ORDER BY startDate ASC`,
      [roomId]
    );

    // Fetch availability rules for the room
    const [availabilityRows]: any = await pool.query(
      `SELECT 
        id,
        startDate,
        endDate,
        isBlocked,
        reason
      FROM room_availability_rules
      WHERE roomId = ? AND isActive = 1
      ORDER BY startDate ASC`,
      [roomId]
    );

    return NextResponse.json({
      ...room,
      amenities: amenityRows,
      pricingRules: pricingRows,
      availabilityRules: availabilityRows
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room details' },
      { status: 500 }
    );
  }
} 