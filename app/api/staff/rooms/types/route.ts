import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

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

    // Get room types with availability information
    const [roomRows] = await pool.execute(`
      SELECT 
        r.id,
        r.name,
        r.type,
        r.description,
        r.capacity,
        r.pricePerNight,
        r.discountedPrice,
        r.images,
        COUNT(ru.id) as totalUnits,
        SUM(CASE 
          WHEN ru.status = 'available' 
            AND ru.id NOT IN (
              SELECT b.roomUnitId 
              FROM bookings b 
              WHERE b.checkInDate <= ? 
                AND b.checkOutDate > ? 
                AND b.status IN ('CONFIRMED', 'CHECKED_IN')
            ) 
          THEN 1 ELSE 0 
        END) as availableUnits,
        SUM(CASE 
          WHEN ru.id IN (
            SELECT b.roomUnitId 
            FROM bookings b 
            WHERE b.checkInDate <= ? 
              AND b.checkOutDate > ? 
              AND b.status IN ('CONFIRMED', 'CHECKED_IN')
          ) 
          THEN 1 ELSE 0 
        END) as occupiedUnits,
        SUM(CASE WHEN ru.status = 'maintenance' THEN 1 ELSE 0 END) as maintenanceUnits
      FROM rooms r
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ?
      GROUP BY r.id, r.name, r.type, r.description, r.capacity, r.pricePerNight, r.discountedPrice, r.images
      ORDER BY r.type, r.name
    `, [date, date, date, date, staff.hotelId])

    // Group by room type
    const roomTypesMap = new Map()

    if (Array.isArray(roomRows)) {
      roomRows.forEach((row: any) => {
        const roomType = row.type
        
        if (!roomTypesMap.has(roomType)) {
          roomTypesMap.set(roomType, {
            id: row.id, // Use first room's ID as representative
            name: row.name,
            type: row.type,
            description: row.description,
            capacity: row.capacity,
            pricePerNight: parseFloat(row.pricePerNight),
            discountedPrice: row.discountedPrice ? parseFloat(row.discountedPrice) : null,
            images: row.images ? JSON.parse(row.images) : [],
            totalRooms: 0,
            availableRooms: 0,
            occupiedRooms: 0,
            maintenanceRooms: 0
          })
        }

        const roomTypeData = roomTypesMap.get(roomType)
        roomTypeData.totalRooms += parseInt(row.totalUnits) || 0
        roomTypeData.availableRooms += parseInt(row.availableUnits) || 0
        roomTypeData.occupiedRooms += parseInt(row.occupiedUnits) || 0
        roomTypeData.maintenanceRooms += parseInt(row.maintenanceUnits) || 0
      })
    }

    const roomTypes = Array.from(roomTypesMap.values())

    return NextResponse.json({
      roomTypes,
      date
    })

  } catch (error) {
    console.error('Error fetching room types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room types' },
      { status: 500 }
    )
  }
}