import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Endpoint only available in development mode' }, { status: 403 });
    }
    
    // Check if user is admin (for safety)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Only admins can access debug endpoints' }, { status: 403 });
    }
    
    const roomId = params.id;
    console.log(`[DEBUG API] Checking room ID: ${roomId}`);
    
    // Basic room check
    const [roomResults] = await pool.query(
      `SELECT * FROM rooms WHERE id = ?`,
      [roomId]
    );
    
    if ((roomResults as any[]).length === 0) {
      return NextResponse.json({ 
        error: `Room ID ${roomId} does not exist in the database.`,
        exists: false 
      });
    }
    
    const room = (roomResults as any[])[0];
    
    // Check hotel
    const [hotelResults] = await pool.query(
      `SELECT h.*, v.id as vendorId, v.name as vendorName
       FROM hotels h
       LEFT JOIN vendors v ON h.vendorId = v.id
       WHERE h.id = ?`,
      [room.hotelId]
    );
    
    const hotel = (hotelResults as any[]).length > 0 ? (hotelResults as any[])[0] : null;
    
    // Check room type
    let roomType = null;
    if (room.roomTypeId) {
      const [typeResults] = await pool.query(
        `SELECT * FROM room_types WHERE id = ?`,
        [room.roomTypeId]
      );
      
      if ((typeResults as any[]).length > 0) {
        roomType = (typeResults as any[])[0];
      }
    }
    
    // Check permissions
    let vendorPermission = false;
    if (hotel && hotel.vendorId) {
      vendorPermission = true;
    }
    
    return NextResponse.json({
      exists: true,
      room,
      hotel,
      roomType,
      permissions: {
        vendorHasAccess: vendorPermission
      },
      sessionInfo: {
        role: session.user.role,
        vendorId: session.user.vendorId,
        name: session.user.name
      }
    });
    
  } catch (error) {
    console.error('[DEBUG API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 