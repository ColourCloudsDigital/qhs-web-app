import { NextRequest, NextResponse } from 'next/server';
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

    console.log(`[API] Fetching room units for hotel ID: ${hotelId}`);

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

    // Get room units for the hotel with room information
    const [roomUnits] = await pool.query(
      `SELECT 
        ru.id,
        ru.roomNumber,
        ru.roomId,
        r.name as roomName
       FROM room_units ru
       LEFT JOIN rooms r ON ru.roomId = r.id
       WHERE r.hotelId = ?
       ORDER BY ru.roomNumber ASC`,
      [hotelId]
    ) as [RowDataPacket[], any];

    // Format the response to match the expected Room interface
    const formattedRoomUnits = roomUnits.map((unit: any) => ({
      id: unit.id,
      name: unit.roomName ? `${unit.roomName} - ${unit.roomNumber}` : unit.roomNumber,
      roomNumber: unit.roomNumber,
      roomId: unit.roomId,
      roomName: unit.roomName
    }));

    return NextResponse.json(formattedRoomUnits, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching room units:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch room units' },
      { status: 500 }
    );
  }
}