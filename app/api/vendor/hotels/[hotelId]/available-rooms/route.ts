import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function GET(
  request: Request,
  { params }: { params: Record<string, string> }
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

    // Support both param casing coming from Next.js routes (hotelid) and possible hotelId
    const hotelId = (params as any).hotelid || (params as any).hotelId;
    const { searchParams } = new URL(request.url);
    // Accept either `checkInDate`/`checkOutDate` or `checkIn`/`checkOut` from different clients
    const checkInDate = searchParams.get('checkInDate') || searchParams.get('checkIn');
    const checkOutDate = searchParams.get('checkOutDate') || searchParams.get('checkOut');

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

    // Base query to get all rooms with their current availability
    let query = `
      SELECT 
        r.*,
        rt.name as roomTypeName,
        rt.description as roomTypeDescription,
        rt.basePrice as roomTypeBasePrice,
        COUNT(ru.id) as totalUnits,
        SUM(CASE WHEN ru.status = 'available' THEN 1 ELSE 0 END) as availableUnits
      FROM rooms r
      LEFT JOIN room_types rt ON r.roomTypeId = rt.id
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ? AND r.isActive = 1
    `;

    const queryParams = [hotelId];

    // If dates are provided, check availability for those dates using a simpler overlap check
    if (checkInDate && checkOutDate) {
      query = `
        SELECT 
          r.*,
          rt.name as roomTypeName,
          rt.description as roomTypeDescription,
          rt.basePrice as roomTypeBasePrice,
          COUNT(ru.id) as totalUnits,
          COUNT(ru.id) - COALESCE(
            (
              SELECT COUNT(DISTINCT ru2.id)
              FROM room_units ru2
              LEFT JOIN bookings b ON ru2.currentBookingId = b.id
              WHERE ru2.roomId = r.id
              AND b.status NOT IN ('CANCELED', 'COMPLETED')
              AND b.checkInDate < ?
              AND b.checkOutDate > ?
            ), 0
          ) as availableUnits
        FROM rooms r
        LEFT JOIN room_types rt ON r.roomTypeId = rt.id
        LEFT JOIN room_units ru ON r.id = ru.roomId
        WHERE r.hotelId = ? AND r.isActive = 1
      `;

      // placeholders correspond to the overlap check: desiredCheckOut, desiredCheckIn, hotelId
      queryParams.push(checkOutDate, checkInDate, hotelId);
    }

    query += ' GROUP BY r.id';

    const [rows]: any = await pool.query(query, queryParams);

    // For each room, fetch amenities
    const roomsWithAmenities = await Promise.all(
      rows.map(async (room: any) => {
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

        // If dates are provided, check for pricing rules
        let finalPrice = room.pricePerNight;
        if (checkInDate && checkOutDate) {
          const [pricingRows]: any = await pool.query(
            `SELECT 
              priceAdjustment,
              adjustmentType
            FROM room_pricing_rules
            WHERE roomId = ?
              AND isActive = 1
              AND startDate <= ?
              AND endDate >= ?
            ORDER BY createdAt DESC
            LIMIT 1`,
            [room.id, checkOutDate, checkInDate]
          );

          if (pricingRows.length > 0) {
            const { priceAdjustment, adjustmentType } = pricingRows[0];
            if (adjustmentType === 'PERCENTAGE') {
              finalPrice = finalPrice * (1 + priceAdjustment / 100);
            } else {
              finalPrice = finalPrice + priceAdjustment;
            }
          }
        }

        return {
          ...room,
          amenities: amenityRows,
          finalPrice
        };
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