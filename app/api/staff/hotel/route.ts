import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get staff info to find their hotel
    const [staffResults] = await pool.query(
      `SELECT s.hotelId, h.name as hotelName 
       FROM staff s 
       LEFT JOIN hotels h ON s.hotelId = h.id 
       WHERE s.userId = ?`,
      [session.user.id]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = (staffResults as any[])[0];
    
    if (!staff.hotelId) {
      return NextResponse.json(
        { error: 'No hotel assigned to this staff member' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: staff.hotelId,
      name: staff.hotelName,
    });

  } catch (error) {
    console.error('Error fetching staff hotel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel information' },
      { status: 500 }
    );
  }
}
