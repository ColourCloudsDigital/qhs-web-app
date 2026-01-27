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
    const { searchParams } = new URL(request.url);
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');

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
        r.type as roomTypeName,
        r.description as roomTypeDescription,
        r.pricePerNight as roomTypeBasePrice,
        COUNT(ru.id) as totalUnits,
        SUM(CASE WHEN ru.status = 'available' THEN 1 ELSE 0 END) as availableUnits
      FROM rooms r
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ? AND r.status = 'active'
    `;

    const queryParams = [hotelId];

    // If dates are provided, check availability for those dates
    if (checkInDate && checkOutDate) {
      query = `
        SELECT 
          r.*,
          r.type as roomTypeName,
          r.description as roomTypeDescription,
          r.pricePerNight as roomTypeBasePrice,
          COUNT(ru.id) as totalUnits,
          COUNT(ru.id) - COALESCE(
            (
              SELECT COUNT(DISTINCT ru2.id)
              FROM room_units ru2
              LEFT JOIN bookings b ON ru2.currentBookingId = b.id
              WHERE ru2.roomId = r.id
              AND b.status NOT IN ('CANCELED', 'COMPLETED')
              AND (
                (b.checkInDate <= ? AND b.checkOutDate > ?)
                OR (b.checkInDate < ? AND b.checkOutDate >= ?)
                OR (b.checkInDate >= ? AND b.checkOutDate <= ?)
              )
            ), 0
          ) as availableUnits
        FROM rooms r
        LEFT JOIN room_units ru ON r.id = ru.roomId
        WHERE r.hotelId = ? AND r.status = 'active'
      `;

      queryParams.push(
        checkOutDate, // b.checkInDate <= checkOutDate
        checkInDate,  // b.checkOutDate > checkInDate
        checkOutDate, // b.checkInDate < checkOutDate
        checkOutDate, // b.checkOutDate >= checkOutDate
        checkInDate,  // b.checkInDate >= checkInDate
        checkOutDate, // b.checkOutDate <= checkOutDate
        hotelId
      );
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