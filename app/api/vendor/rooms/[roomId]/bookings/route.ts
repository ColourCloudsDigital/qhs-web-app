import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = params;

    const [rows] = await pool.query(
      `SELECT b.id, b.checkInDate, b.checkOutDate, b.status, b.paymentStatus, b.totalAmount,
              CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) as guestName
       FROM bookings b
       JOIN room_units ru ON b.roomUnitId = ru.id
       LEFT JOIN customers c ON b.customerId = c.id
       WHERE b.roomUnitId = ?
       ORDER BY b.checkInDate DESC
       LIMIT 20`,
      [roomId]  // roomId param here is actually the room_unit.id
    );

    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error('Error fetching room bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch room bookings' }, { status: 500 });
  }
}
