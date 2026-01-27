import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId');

    let query = `
      SELECT 
        ru.id as unitId,
        ru.roomNumber,
        ru.status as unitStatus,
        ru.notes,
        ru.lastCleanedAt,
        r.id as roomId,
        r.name as roomName,
        r.type as roomType,
        r.pricePerNight,
        r.discountedPrice,
        r.capacity as maxGuests,
        r.description as roomDescription,
        r.images as roomImages,
        r.status as roomStatus,
        h.id as hotelId,
        h.name as hotelName,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.roomUnitId = ru.id 
            AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'PENDING')
            AND b.checkOutDate > CURDATE()
          ) THEN 'occupied'
          ELSE ru.status
        END as effectiveStatus
      FROM room_units ru
      JOIN rooms r ON ru.roomId = r.id
      JOIN hotels h ON r.hotelId = h.id
      WHERE h.vendorId = ?
    `;

    const queryParams = [vendorId];

    // Filter by specific hotel if provided
    if (hotelId) {
      query += ` AND h.id = ?`;
      queryParams.push(hotelId);
    }

    query += ` ORDER BY h.name, r.name, ru.roomNumber`;

    const [roomUnitsResults] = await pool.query(query, queryParams);

    // Format the response data
    const roomUnits = (roomUnitsResults as any[]).map((unit: any) => ({
      unitId: unit.unitId,
      roomNumber: unit.roomNumber,
      unitStatus: unit.effectiveStatus, // Use effective status that considers bookings
      notes: unit.notes,
      lastCleanedAt: unit.lastCleanedAt,
      roomId: unit.roomId,
      roomName: unit.roomName,
      roomType: unit.roomType,
      pricePerNight: parseFloat(unit.pricePerNight) || 0,
      discountedPrice: unit.discountedPrice ? parseFloat(unit.discountedPrice) : null,
      finalPrice: unit.discountedPrice ? parseFloat(unit.discountedPrice) : parseFloat(unit.pricePerNight) || 0,
      maxGuests: parseInt(unit.maxGuests) || 1,
      roomDescription: unit.roomDescription,
      roomImages: unit.roomImages,
      roomStatus: unit.roomStatus,
      hotelId: unit.hotelId,
      hotelName: unit.hotelName,
      displayName: `${unit.hotelName} - ${unit.roomName} - Room ${unit.roomNumber} (${unit.roomType})`,
      statusDisplay: unit.effectiveStatus.charAt(0).toUpperCase() + unit.effectiveStatus.slice(1)
    }));

    return NextResponse.json(roomUnits);

  } catch (error) {
    console.error('Error fetching room units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room units' },
      { status: 500 }
    );
  }
}