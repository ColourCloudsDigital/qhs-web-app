import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get staff info to find their hotel
    const [staffResults] = await pool.query(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = (staffResults as any[])[0];
    const hotelId = staff.hotelId;

    if (!hotelId) {
      return NextResponse.json(
        { error: 'No hotel assigned to this staff member' },
        { status: 404 }
      );
    }

    // Get all room units for this hotel with booking status
    const query = `
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
      WHERE r.hotelId = ?
      ORDER BY r.name, ru.roomNumber
    `;

    const [roomUnitsResults] = await pool.query(query, [hotelId]);

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
      displayName: `${unit.roomName} - Room ${unit.roomNumber} (${unit.roomType})`,
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