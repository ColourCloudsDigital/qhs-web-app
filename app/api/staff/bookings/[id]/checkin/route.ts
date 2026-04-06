import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // Get staff info to verify hotel access
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

    // Verify booking belongs to staff's hotel and is confirmed
    const [bookingResults] = await pool.query(
      'SELECT id, status FROM bookings WHERE id = ? AND hotelId = ?',
      [bookingId, hotelId]
    );

    if ((bookingResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = (bookingResults as any[])[0];

    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Only confirmed bookings can be checked in' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update booking status to checked in
      await connection.query(
        'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
        ['CHECKED_IN', bookingId]
      );

      // Mark room unit as occupied
      await connection.query(
        `UPDATE room_units SET status = 'occupied', currentBookingId = ?
         WHERE currentBookingId = ?`,
        [bookingId, bookingId]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      message: 'Guest checked in successfully'
    });

  } catch (error) {
    console.error('Error checking in guest:', error);
    return NextResponse.json(
      { error: 'Failed to check in guest' },
      { status: 500 }
    );
  }
}