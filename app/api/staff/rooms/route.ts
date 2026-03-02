import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get all rooms for the hotel with their units
    const [roomRows] = await pool.execute(`
      SELECT 
        r.*,
        ru.id as unitId,
        ru.roomNumber,
        ru.status as unitStatus,
        ru.currentBookingId,
        ru.lastCleanedAt,
        ru.notes as unitNotes
      FROM rooms r
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ?
      ORDER BY r.name, ru.roomNumber
    `, [staff.hotelId])

    // Get all bookings that affect the selected date
    const [bookingRows] = await pool.execute(`
      SELECT 
        b.*,
        c.firstName,
        c.lastName,
        ru.id as roomUnitId
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE r.hotelId = ? 
        AND b.checkInDate <= ? 
        AND b.checkOutDate > ?
        AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
    `, [staff.hotelId, date, date])

    // Process the data
    const roomsMap = new Map()
    const bookingsMap = new Map()

    // Create bookings map for quick lookup
    if (Array.isArray(bookingRows)) {
      bookingRows.forEach((booking: any) => {
        // Only include bookings that are still active for the selected date
        // CHECKED_OUT bookings should not affect room availability
        if (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') {
          bookingsMap.set(booking.roomUnitId, {
            id: booking.id,
            customerId: booking.customerId,
            customerName: `${booking.firstName} ${booking.lastName}`,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            status: booking.status
          })
        }
      })
    }

    // Process rooms and units
    if (Array.isArray(roomRows)) {
      roomRows.forEach((row: any) => {
        if (!roomsMap.has(row.id)) {
          roomsMap.set(row.id, {
            id: row.id,
            name: row.name,
            type: row.type,
            description: row.description,
            capacity: row.capacity,
            pricePerNight: parseFloat(row.pricePerNight),
            discountedPrice: row.discountedPrice ? parseFloat(row.discountedPrice) : null,
            status: row.status,
            images: row.images ? JSON.parse(row.images) : [],
            totalUnits: 0,
            occupiedUnits: []
          })
        }

        const room = roomsMap.get(row.id)
        
        if (row.unitId) {
          room.totalUnits++
          
          const booking = bookingsMap.get(row.unitId)
          // Base status comes from room_units table (available, maintenance, cleaning)
          let unitStatus = row.unitStatus 
          
          // Override with booking-derived status if there's an active booking
          if (booking) {
            if (booking.status === 'CHECKED_IN') {
              unitStatus = 'occupied'
            } else if (booking.status === 'CONFIRMED') {
              unitStatus = 'reserved'
            }
            // CHECKED_OUT bookings don't affect room status - room keeps its room_units status
          }

          room.occupiedUnits.push({
            id: row.unitId,
            roomId: row.id,
            roomNumber: row.roomNumber,
            status: unitStatus,
            currentBookingId: booking ? booking.id : null,
            lastCleanedAt: row.lastCleanedAt,
            notes: row.unitNotes,
            booking: booking || null
          })
        }
      })
    }

    // Calculate available units for each room
    const processedRooms = Array.from(roomsMap.values()).map((room: any) => {
      const availableUnits = room.occupiedUnits.filter((unit: any) => unit.status === 'available').length
      
      return {
        ...room,
        availableUnits
      }
    })

    return NextResponse.json({
      rooms: processedRooms,
      date
    })

  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}
