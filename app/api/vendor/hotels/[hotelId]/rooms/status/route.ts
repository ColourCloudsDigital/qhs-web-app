import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { BookingStatus } from '@/lib/types/enums';

interface RoomStatusItem {
  id: string;
  roomNumber: string;
  type: string;
  capacity: number;
  price: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning';
  guestName?: string;
  checkOutDate?: Date;
  bookingId?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    console.log('[API] Room status request for hotelId:', params.hotelId);
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const hotelId = params.hotelId;
    console.log('[API] Using hotelId:', hotelId);
    
    // Check access rights
    if (session.user.role === 'VENDOR') {
      const [hotelRows] = await pool.query(`
        SELECT h.* FROM hotels h
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE h.id = ? AND u.id = ?
      `, [hotelId, session.user.id]);
      
      if ((hotelRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      const [staffRows] = await pool.query(`
        SELECT s.* FROM staff s
        JOIN users u ON s.userId = u.id
        WHERE u.id = ? AND s.hotelId = ?
      `, [session.user.id, hotelId]);
      
      if ((staffRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get all room units for this hotel
    console.log('[API] Fetching room units for hotelId:', hotelId);
    
    // Get all rooms for this hotel first
    const [roomRows]: any = await pool.query(`
      SELECT id, type, name, pricePerNight, capacity 
      FROM rooms 
      WHERE hotelId = ?
    `, [hotelId]);
    
    console.log(`[API] Found ${roomRows.length} rooms for this hotel`);
    
    // Get all room units for these rooms
    let allRoomUnits: RoomStatusItem[] = [];
    
    // Collect all room IDs to use in the query
    const roomIds = roomRows.map((room: any) => room.id);
    
    if (roomIds.length === 0) {
      console.log('[API] No rooms found for this hotel');
      return NextResponse.json({
        rooms: [],
        debug: { message: 'No rooms found for this hotel' }
      });
    }
    
    try {
      // Query all room units in a single query
      const [roomUnitRows]: any = await pool.query(`
        SELECT 
          ru.id, 
          ru.roomId, 
          ru.roomNumber, 
          ru.status,
          r.type,
          r.name,
          r.pricePerNight,
          r.capacity
        FROM room_units ru
        JOIN rooms r ON ru.roomId = r.id
        WHERE ru.roomId IN (?)
      `, [roomIds]);
      
      console.log(`[API] Found ${roomUnitRows.length} room units`);
      
      if (roomUnitRows.length > 0) {
        
        // Process each room unit into the expected format
        allRoomUnits = roomUnitRows.map((unit: any) => {
          // Get room parent info
          const parentRoom = roomRows.find((r: any) => r.id === unit.roomId) || {};
          
          // Find room type based on the parent room
          const roomType = unit.type || parentRoom.type || 'Standard';
          
          // Determine room status
          let status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning' = 'available';
          if (unit.status) {
            const unitStatus = String(unit.status).toUpperCase();
            
            if (unitStatus === 'MAINTENANCE') {
              status = 'maintenance';
            } else if (unitStatus === 'CLEANING') {
              status = 'cleaning';
            } else if (unitStatus === 'OCCUPIED') {
              status = 'occupied';
            } else if (unitStatus === 'RESERVED') {
              status = 'reserved';
            }
          }
          
          // Get room price
          const roomPrice = 
            typeof unit.pricePerNight === 'number' ? unit.pricePerNight :
            typeof parentRoom.pricePerNight === 'number' ? parentRoom.pricePerNight :
            parseFloat(String(unit.pricePerNight || parentRoom.pricePerNight)) || 
            // Fallback prices based on room type
            (roomType.toLowerCase().includes('suite') ? 30000 :
             roomType.toLowerCase().includes('executive') ? 20000 :
             roomType.toLowerCase().includes('lounge') ? 25000 : 18000);
          
          return {
            id: unit.id,
            roomId: unit.roomId,
            roomNumber: unit.roomNumber || '',
            type: roomType,
            capacity: unit.capacity || parentRoom.capacity || 2,
            price: roomPrice,
            pricePerNight: roomPrice,
            status: status,
          };
        });
      }
    } catch (error) {
      console.error('[API] Error fetching room units:', error);
      
      // Fallback to direct room query if the room_units query fails
      console.log('[API] Falling back to alternative approach');
      
      try {
        // Try a different approach - fetch room units directly with hotelId
        const [directRoomUnits]: any = await pool.query(`
          SELECT 
            ru.id, 
            ru.roomId, 
            ru.roomNumber, 
            ru.status,
            r.type,
            r.name,
            r.pricePerNight,
            r.capacity
          FROM room_units ru
          JOIN rooms r ON ru.roomId = r.id
          WHERE r.hotelId = ?
        `, [hotelId]);
        
        console.log(`[API] Found ${directRoomUnits.length} room units using direct query`);
        
        if (directRoomUnits.length > 0) {
          // Process each room unit
          allRoomUnits = directRoomUnits.map((unit: any) => {
            const roomType = unit.type || 'Standard';
            
            let status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning' = 'available';
            if (unit.status) {
              const unitStatus = String(unit.status).toUpperCase();
              
              if (unitStatus === 'MAINTENANCE') {
                status = 'maintenance';
              } else if (unitStatus === 'CLEANING') {
                status = 'cleaning';
              } else if (unitStatus === 'OCCUPIED') {
                status = 'occupied';
              } else if (unitStatus === 'RESERVED') {
                status = 'reserved';
              }
            }
            
            const roomPrice = parseFloat(String(unit.pricePerNight)) || 18000;
            
            return {
              id: unit.id,
              roomId: unit.roomId,
              roomNumber: unit.roomNumber || '',
              type: roomType,
              capacity: unit.capacity || 2,
              price: roomPrice,
              pricePerNight: roomPrice,
              status: status,
            };
          });
        }
      } catch (directError) {
        console.error('[API] Error with direct room units query:', directError);
      }
    }
    
    // If still no room units found, fall back to creating placeholders from rooms
    if (allRoomUnits.length === 0) {
      console.log('[API] No room units found, creating placeholder data from rooms');
      
      // Create placeholder data based on the rooms
      allRoomUnits = roomRows.map((room: any, index: number) => {
        return {
          id: room.id,
          roomId: room.id,
          roomNumber: `${index + 101}`,
          type: room.type || 'Standard',
          capacity: room.capacity || 2,
          price: parseFloat(String(room.pricePerNight)) || 18000,
          pricePerNight: parseFloat(String(room.pricePerNight)) || 18000,
          status: 'available' as const,
        };
      });
    }
    
    // Sort rooms by number
    allRoomUnits.sort((a, b) => {
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });
    
    console.log(`[API] Returning ${allRoomUnits.length} room units`);
    
    return NextResponse.json({
      rooms: allRoomUnits,
      debug: {
        roomCount: roomRows.length,
        roomUnitCount: allRoomUnits.length,
        sampleRoomUnit: allRoomUnits.length > 0 ? allRoomUnits[0] : null
      }
    });
  } catch (error) {
    console.error('[API] Error fetching room status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch room status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}