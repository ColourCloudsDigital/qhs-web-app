import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors, staff, and admins can update room status
    if (!['VENDOR', 'STAFF', 'SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const roomId = params.roomId;
    const { status } = await request.json();
    
    // Validate status value
    const validStatuses = ['available', 'maintenance', 'cleaning'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: available, maintenance, cleaning' },
        { status: 400 }
      );
    }
    
    // Check if the room unit exists and if the user has access to it
    let query = '';
    const queryParams: any[] = [];
    
    if (session.user.role === 'VENDOR') {
      query = `
        SELECT ru.*, r.hotelId FROM room_units ru
        JOIN rooms r ON ru.roomId = r.id
        JOIN hotels h ON r.hotelId = h.id
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE ru.id = ? AND u.id = ?
      `;
      queryParams.push(roomId, session.user.id);
    } else if (session.user.role === 'STAFF') {
      query = `
        SELECT ru.*, r.hotelId FROM room_units ru
        JOIN rooms r ON ru.roomId = r.id
        JOIN staff s ON r.hotelId = s.hotelId
        JOIN users u ON s.userId = u.id
        WHERE ru.id = ? AND u.id = ?
      `;
      queryParams.push(roomId, session.user.id);
    } else {
      query = `
        SELECT ru.*, r.hotelId FROM room_units ru
        JOIN rooms r ON ru.roomId = r.id
        WHERE ru.id = ?
      `;
      queryParams.push(roomId);
    }
    
    const [rows] = await pool.query(query, queryParams);
    
    if (!(rows as any[]).length) {
      return NextResponse.json(
        { error: 'Room unit not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    const roomUnit = (rows as any[])[0];
    const oldStatus = roomUnit.status;
    
    // Update the room unit status (clear currentBookingId for non-booking statuses)
    await pool.query(
      `UPDATE room_units SET status = ?, currentBookingId = NULL WHERE id = ?`,
      [status, roomId]
    );
    
    // Create notification for room unit status change
    try {
      const roomNumber = roomUnit.roomNumber;
      const hotelId = roomUnit.hotelId;

      await NotificationService.notifyRoomStatusChanged(
        session.user.id,
        roomId,
        roomNumber,
        oldStatus,
        status,
        session.user.id
      );
      
      if (hotelId) {
        const staffUsers = await NotificationService.getHotelStaff(hotelId);
        
        if (staffUsers.length > 0) {
          await NotificationService.createBulkNotifications(
            staffUsers.filter(id => id !== session.user.id),
            {
              title: 'Room Status Updated',
              content: `Room ${roomNumber} status changed from ${oldStatus} to ${status}`,
              type: 'SYSTEM' as any,
              senderId: session.user.id,
              metadata: {
                roomUnitId: roomId,
                hotelId,
                action: 'status_changed',
                entityType: 'room_unit',
                oldValue: oldStatus,
                newValue: status
              }
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('Error creating room status notification:', notificationError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Room status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    );
  }
} 