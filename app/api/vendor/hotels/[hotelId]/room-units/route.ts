import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    console.log('[API] Fetching room units for hotel:', params.hotelId);
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors and staff can access room units
    if (
      session.user.role !== UserRole.VENDOR && 
      session.user.role !== UserRole.STAFF && 
      session.user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // For now, skip vendor verification to debug the issue
    console.log('[API] User role:', session.user.role);
    console.log('[API] Fetching room units for hotel:', params.hotelId);
    
    // Get room units with room details
    const [roomUnits] = await pool.query(
      `SELECT 
        ru.id,
        ru.roomNumber,
        ru.status,
        ru.currentBookingId,
        ru.lastCleanedAt,
        ru.notes,
        ru.createdAt,
        ru.updatedAt,
        r.id as roomId,
        r.name as roomName,
        r.type,
        r.pricePerNight,
        r.discountedPrice,
        COALESCE(r.discountedPrice, r.pricePerNight) as finalPrice,
        r.capacity as maxGuests,
        r.description as roomDescription,
        r.images as roomImages,
        r.status as roomStatus
      FROM room_units ru
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ?
      ORDER BY ru.roomNumber ASC`,
      [params.hotelId]
    );
    
    console.log(`[API] Found ${(roomUnits as any[]).length} room units`);
    
    return NextResponse.json(roomUnits);
  } catch (error) {
    console.error('[API] Error fetching room units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room units' },
      { status: 500 }
    );
  }
}