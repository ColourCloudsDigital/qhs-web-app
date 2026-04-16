import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import NotificationService from '@/lib/services/notification.service';
import { NotificationType } from '@/lib/types/enums';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Only staff can request cancellations' }, { status: 403 });
    }

    const bookingId = params.id;
    const { reason } = await request.json();

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    // Verify booking exists and belongs to staff's hotel
    const [staffRows] = await pool.query(
      'SELECT hotelId, vendorId FROM staff WHERE userId = ?',
      [session.user.id]
    );
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });

    const [bookingRows] = await pool.query(
      'SELECT id, status, hotelId FROM bookings WHERE id = ? AND hotelId = ?',
      [bookingId, staff.hotelId]
    );
    const booking = (bookingRows as any[])[0];
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot request cancellation for a booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Update booking status to CANCELLATION_REQUESTED and store reason
    const currentSpecialRequests = await pool.query(
      'SELECT specialRequests FROM bookings WHERE id = ?', [bookingId]
    );
    const existing = (currentSpecialRequests[0] as any[])[0]?.specialRequests || '';
    const cancellationNote = `CANCELLATION_REQUEST: ${reason} (requested by staff: ${session.user.id})`;
    const updatedRequests = existing ? `${existing}\n\n${cancellationNote}` : cancellationNote;

    await pool.query(
      `UPDATE bookings SET status = 'CANCELLATION_REQUESTED', specialRequests = ?, updatedAt = NOW() WHERE id = ?`,
      [updatedRequests, bookingId]
    );

    // Notify the vendor
    try {
      const [vendorUserRows] = await pool.query(
        `SELECT u.id FROM users u JOIN vendors v ON u.id = v.userId WHERE v.id = ?`,
        [staff.vendorId]
      );
      const vendorUserId = (vendorUserRows as any[])[0]?.id;

      if (vendorUserId) {
        await NotificationService.createNotification({
          title: 'Cancellation Request',
          content: `Staff has requested cancellation for booking #${bookingId.slice(0, 8).toUpperCase()}. Reason: ${reason}`,
          type: NotificationType.BOOKING,
          userId: vendorUserId,
          senderId: session.user.id,
          metadata: {
            bookingId,
            action: 'cancellation_requested',
            entityType: 'booking',
            reason,
          },
        });
      }
    } catch (notifError) {
      console.error('Failed to send cancellation notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cancellation request submitted. Awaiting vendor approval.',
    });
  } catch (error) {
    console.error('Error requesting cancellation:', error);
    return NextResponse.json({ error: 'Failed to request cancellation' }, { status: 500 });
  }
}
