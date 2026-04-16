import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole, NotificationType } from '@/lib/types/enums';
import NotificationService from '@/lib/services/notification.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = [UserRole.VENDOR, UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!session?.user || !allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Only vendors can approve cancellations' }, { status: 403 });
    }

    const bookingId = params.id;
    const { action, notes } = await request.json(); // action: 'approve' | 'decline'

    if (!['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "decline"' }, { status: 400 });
    }

    // Verify booking exists and belongs to this vendor's hotel
    const [bookingRows] = await pool.query(
      `SELECT b.id, b.status, b.hotelId, b.customerId, h.vendorId
       FROM bookings b
       JOIN hotels h ON b.hotelId = h.id
       WHERE b.id = ?`,
      [bookingId]
    );
    const booking = (bookingRows as any[])[0];
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (booking.status !== 'CANCELLATION_REQUESTED') {
      return NextResponse.json(
        { error: 'Booking does not have a pending cancellation request' },
        { status: 400 }
      );
    }

    // Verify vendor owns this hotel (skip for super admin)
    if (session.user.role === UserRole.VENDOR) {
      const [vendorRows] = await pool.query(
        'SELECT id FROM vendors WHERE userId = ? AND id = ?',
        [session.user.id, booking.vendorId]
      );
      if ((vendorRows as any[]).length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const newStatus = action === 'approve' ? 'CANCELLED' : 'CONFIRMED';
    const actionLabel = action === 'approve' ? 'approved' : 'declined';

    const client = await pool.getConnection();
    try {
      await client.beginTransaction();

      await client.query(
        `UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?`,
        [newStatus, bookingId]
      );

      // If approved, free the room unit
      if (action === 'approve') {
        await client.query(
          `UPDATE room_units SET status = 'available', currentBookingId = NULL WHERE currentBookingId = ?`,
          [bookingId]
        );
      }

      await client.commit();
    } catch (err) {
      await client.rollback();
      throw err;
    } finally {
      client.release();
    }

    // Notify staff who made the request
    try {
      const [staffRows] = await pool.query(
        `SELECT s.userId FROM staff s WHERE s.hotelId = ?`,
        [booking.hotelId]
      );
      const staffUserIds = (staffRows as any[]).map((r: any) => r.userId);

      if (staffUserIds.length > 0) {
        await NotificationService.createBulkNotifications(
          staffUserIds,
          {
            title: `Cancellation Request ${action === 'approve' ? 'Approved' : 'Declined'}`,
            content: `The cancellation request for booking #${bookingId.slice(0, 8).toUpperCase()} has been ${actionLabel}.${notes ? ` Note: ${notes}` : ''}`,
            type: NotificationType.BOOKING,
            senderId: session.user.id,
            metadata: { bookingId, action: `cancellation_${actionLabel}`, entityType: 'booking' },
          }
        );
      }

      // Also notify the customer
      const [customerRows] = await pool.query(
        'SELECT userId FROM customers WHERE id = ?',
        [booking.customerId]
      );
      const customerUserId = (customerRows as any[])[0]?.userId;
      if (customerUserId) {
        await NotificationService.createNotification({
          title: `Booking Cancellation ${action === 'approve' ? 'Confirmed' : 'Declined'}`,
          content: action === 'approve'
            ? `Your cancellation request for booking #${bookingId.slice(0, 8).toUpperCase()} has been approved.`
            : `Your cancellation request for booking #${bookingId.slice(0, 8).toUpperCase()} was declined. Your booking remains active.`,
          type: NotificationType.BOOKING,
          userId: customerUserId,
          senderId: session.user.id,
          metadata: { bookingId, action: `cancellation_${actionLabel}`, entityType: 'booking' },
        });
      }
    } catch (notifError) {
      console.error('Failed to send approval notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Cancellation request ${actionLabel} successfully.`,
    });
  } catch (error) {
    console.error('Error processing cancellation approval:', error);
    return NextResponse.json({ error: 'Failed to process cancellation request' }, { status: 500 });
  }
}
