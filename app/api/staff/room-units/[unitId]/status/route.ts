import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'
import { staffNotificationService } from '@/lib/services/staff-notification.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { unitId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const [staffRows] = await pool.execute(
      'SELECT s.*, h.name as hotelName FROM staff s JOIN hotels h ON s.hotelId = h.id WHERE s.userId = ?',
      [session.user.id]
    )

    if (!Array.isArray(staffRows) || staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const staff = staffRows[0] as any
    const { unitId } = params
    const { status } = await request.json()

    // Validate status - only allow room_units table statuses
    const validStatuses = ['available', 'maintenance', 'cleaning']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Only available, maintenance, and cleaning are allowed.' 
      }, { status: 400 })
    }

    // Check if the room unit belongs to the staff's hotel
    const [unitRows] = await pool.execute(`
      SELECT ru.*, r.hotelId 
      FROM room_units ru
      JOIN rooms r ON ru.roomId = r.id
      WHERE ru.id = ? AND r.hotelId = ?
    `, [unitId, staff.hotelId])

    if (!Array.isArray(unitRows) || unitRows.length === 0) {
      return NextResponse.json({ error: 'Room unit not found' }, { status: 404 })
    }

    const roomUnit = unitRows[0] as any

    // Check if room unit has active bookings (cannot change status if occupied/reserved)
    const [activeBookingRows] = await pool.execute(`
      SELECT b.* FROM bookings b
      WHERE b.roomUnitId = ? 
        AND b.status IN ('CONFIRMED', 'CHECKED_IN')
        AND b.checkOutDate > CURDATE()
    `, [unitId])

    if (Array.isArray(activeBookingRows) && activeBookingRows.length > 0) {
      const booking = activeBookingRows[0] as any
      const statusText = booking.status === 'CHECKED_IN' ? 'occupied' : 'reserved'
      return NextResponse.json({ 
        error: `Cannot change status of ${statusText} room unit. Guest must check out first.` 
      }, { status: 400 })
    }

    // Update the room unit status
    await pool.execute(`
      UPDATE room_units 
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, unitId])

    // If status is set to cleaning, update lastCleanedAt
    if (status === 'cleaning') {
      await pool.execute(`
        UPDATE room_units 
        SET lastCleanedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [unitId])
    }

    // Send notification about room status change
    try {
      await staffNotificationService.notifyRoomStatusChanged({
        roomNumber: roomUnit.roomNumber,
        status,
        hotelId: staff.hotelId
      }, session.user.id);
    } catch (notificationError) {
      console.error('Failed to send room status change notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Room unit status updated successfully'
    })

  } catch (error) {
    console.error('Error updating room unit status:', error)
    return NextResponse.json(
      { error: 'Failed to update room unit status' },
      { status: 500 }
    )
  }
}