import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '@/services/rooms';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotelId = params.id;

    if (!hotelId) {
      return NextResponse.json(
        { error: 'Hotel ID is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching rooms for hotel ID: ${hotelId}`);

    // Verify hotel exists
    const [hotelExists] = await pool.query(
      'SELECT id FROM hotels WHERE id = ?',
      [hotelId]
    ) as [RowDataPacket[], any];

    if (!hotelExists || hotelExists.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Get rooms for the hotel
    const rooms = await RoomService.getRoomsByHotel(hotelId);

    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching rooms:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
