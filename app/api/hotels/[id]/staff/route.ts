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

    console.log(`[API] Fetching staff for hotel ID: ${hotelId}`);

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

    // Get staff for the hotel
    const [staff] = await pool.query(
      `SELECT s.id, s.userId, s.position, u.name, u.email 
       FROM staff s
       JOIN users u ON s.userId = u.id
       WHERE s.hotelId = ?
       ORDER BY u.name ASC`,
      [hotelId]
    ) as [RowDataPacket[], any];

    // Transform the data to match the expected format
    const formattedStaff = (staff || []).map((member: any) => ({
      id: member.id,
      userId: member.userId,
      position: member.position,
      user: {
        id: member.userId,
        name: member.name,
        email: member.email,
      },
    }));

    return NextResponse.json(formattedStaff, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching staff:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}
