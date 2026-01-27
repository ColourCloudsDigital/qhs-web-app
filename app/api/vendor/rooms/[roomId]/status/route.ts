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
    
    // Check if the room exists and if the user has access to it
    let query = '';
    const queryParams = [];
    
    if (session.user.role === 'VENDOR') {
      // For vendors, check if they own the hotel this room belongs to
      query = `
        SELECT r.* FROM rooms r
        JOIN hotels h ON r.hotelId = h.id
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE r.id = ? AND u.id = ?
      `;
      queryParams.push(roomId, session.user.id);
    } else if (session.user.role === 'STAFF') {
      // For staff, check if they're assigned to the hotel this room belongs to
      query = `
        SELECT r.* FROM rooms r
        JOIN staff s ON r.hotelId = s.hotelId
        JOIN users u ON s.userId = u.id
        WHERE r.id = ? AND u.id = ?
      `;
      queryParams.push(roomId, session.user.id);
    } else {
      // For admins and super admins, just check if the room exists
      query = 'SELECT * FROM rooms WHERE id = ?';
      queryParams.push(roomId);
    }
    
    const [rows] = await pool.query(query, queryParams);
    
    if (!(rows as any[]).length) {
      return NextResponse.json(
        { error: 'Room not found or you do not have access to this room' },
        { status: 404 }
      );
    }
    
    const room = (rows as any[])[0];
    const oldStatus = room.status;
    
    // Update the room status
    await pool.query(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status.toUpperCase(), roomId]
    );
    
    // Create notification for room status change
    try {
      // Get room number from room_units table
      const [roomUnits] = await pool.query(
        'SELECT roomNumber FROM room_units WHERE roomId = ? LIMIT 1',
        [roomId]
      );
      
      const roomNumber = (roomUnits as any[])[0]?.roomNumber || room.name;
      
      await NotificationService.notifyRoomStatusChanged(
        session.user.id,
        roomId,
        roomNumber,
        oldStatus,
        status.toUpperCase(),
        session.user.id
      );
      
      // Notify hotel staff
      const [hotelRows] = await pool.query(
        'SELECT hotelId FROM rooms WHERE id = ?',
        [roomId]
      );
      
      if (hotelRows && (hotelRows as any[]).length > 0) {
        const hotelId = (hotelRows as any[])[0].hotelId;
        const staffUsers = await NotificationService.getHotelStaff(hotelId);
        
        if (staffUsers.length > 0) {
          await NotificationService.createBulkNotifications(
            staffUsers.filter(id => id !== session.user.id),
            {
              title: 'Room Status Updated',
              content: `Room ${roomNumber} status changed from ${oldStatus} to ${status.toUpperCase()}`,
              type: 'SYSTEM' as any,
              senderId: session.user.id,
              metadata: {
                roomId,
                hotelId,
                action: 'status_changed',
                entityType: 'room',
                oldValue: oldStatus,
                newValue: status.toUpperCase()
              }
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('Error creating room status notification:', notificationError);
      // Don't fail the request if notification fails
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