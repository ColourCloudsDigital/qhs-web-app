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
    const checkInDate = searchParams.get('checkIn') || date
    const checkOutDate = searchParams.get('checkOut') || date

    // Get available rooms for the specified date range
    const [roomRows] = await pool.execute(`
      SELECT 
        r.*,
        COUNT(ru.id) as totalUnits,
        COUNT(CASE 
          WHEN ru.status = 'available' 
            AND ru.id NOT IN (
              SELECT DISTINCT b.roomUnitId 
              FROM bookings b 
              WHERE b.checkInDate < ? 
                AND b.checkOutDate > ? 
                AND b.status IN ('CONFIRMED', 'CHECKED_IN')
            ) 
          THEN 1 
        END) as availableUnits
      FROM rooms r
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ?
      GROUP BY r.id
      HAVING availableUnits > 0
      ORDER BY r.name
    `, [checkOutDate, checkInDate, staff.hotelId])

    // Get available room numbers for each room
    const availableRooms = []
    
    if (Array.isArray(roomRows)) {
      for (const room of roomRows as any[]) {
        const [unitRows] = await pool.execute(`
          SELECT ru.roomNumber
          FROM room_units ru
          WHERE ru.roomId = ? 
            AND ru.status = 'available'
            AND ru.id NOT IN (
              SELECT DISTINCT b.roomUnitId 
              FROM bookings b 
              WHERE b.checkInDate < ? 
                AND b.checkOutDate > ? 
                AND b.status IN ('CONFIRMED', 'CHECKED_IN')
            )
          ORDER BY ru.roomNumber
        `, [room.id, checkOutDate, checkInDate])

        const availableRoomNumbers = Array.isArray(unitRows) ? 
          unitRows.map((unit: any) => unit.roomNumber) : []

        availableRooms.push({
          id: room.id,
          name: room.name,
          type: room.type,
          description: room.description,
          capacity: room.capacity,
          pricePerNight: parseFloat(room.pricePerNight),
          discountedPrice: room.discountedPrice ? parseFloat(room.discountedPrice) : null,
          status: room.status,
          images: room.images ? JSON.parse(room.images) : [],
          availableUnits: parseInt(room.availableUnits),
          totalUnits: parseInt(room.totalUnits),
          availableRoomNumbers
        })
      }
    }

    return NextResponse.json({
      rooms: availableRooms,
      checkInDate,
      checkOutDate,
      totalAvailable: availableRooms.length
    })

  } catch (error) {
    console.error('Error fetching available rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available rooms' },
      { status: 500 }
    )
  }
}
