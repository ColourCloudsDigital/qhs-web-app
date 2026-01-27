import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    console.log('[API] Searching bookings for hotel:', params.hotelId);
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors and staff can search bookings
    if (
      session.user.role !== UserRole.VENDOR && 
      session.user.role !== UserRole.STAFF && 
      session.user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || 'CONFIRMED';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query.trim()) {
      return NextResponse.json({
        bookings: []
      });
    }
    
    // Search bookings by booking ID, customer name, or phone
    const searchTerm = `%${query}%`;
    
    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.checkInDate,
        b.checkOutDate,
        b.numberOfGuests,
        b.totalAmount,
        b.status,
        b.paymentStatus,
        b.specialRequests,
        b.createdAt,
        c.firstName,
        c.lastName,
        c.phone,
        u.email,
        ru.roomNumber,
        r.name as roomName,
        r.type as roomType,
        CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) as customerName
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE b.hotelId = ? 
        AND b.status = ?
        AND (
          b.id LIKE ? 
          OR c.firstName LIKE ? 
          OR c.lastName LIKE ? 
          OR CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) LIKE ?
          OR c.phone LIKE ?
          OR u.email LIKE ?
        )
      ORDER BY b.checkInDate ASC, b.createdAt DESC
      LIMIT ?`,
      [params.hotelId, status, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]
    );
    
    console.log(`[API] Found ${(bookings as any[]).length} bookings for search: "${query}"`);
    
    return NextResponse.json({
      bookings: bookings
    });
  } catch (error) {
    console.error('[API] Error searching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to search bookings' },
      { status: 500 }
    );
  }
}