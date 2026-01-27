import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Searching customers');
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors and staff can search customers
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
    
    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!search.trim()) {
      return NextResponse.json({
        customers: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      });
    }
    
    // Search customers across all vendor hotels
    const searchTerm = `%${search}%`;
    
    const [customers] = await pool.query(
      `SELECT 
        c.id,
        c.firstName,
        c.lastName,
        c.phone,
        c.address,
        c.nationality,
        c.idType,
        c.idNumber,
        c.createdAt,
        u.email,
        u.lastLoginAt,
        h.name as hotelName,
        CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) as displayName,
        COUNT(b.id) as totalBookings,
        COALESCE(SUM(b.totalAmount), 0) as totalSpent,
        MAX(b.createdAt) as lastBooking
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN hotels h ON c.hotelId = h.id
      LEFT JOIN bookings b ON c.id = b.customerId
      WHERE h.vendorId = ? 
        AND (
          c.firstName LIKE ? 
          OR c.lastName LIKE ? 
          OR CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) LIKE ?
          OR c.phone LIKE ?
          OR u.email LIKE ?
        )
      GROUP BY c.id, c.firstName, c.lastName, c.phone, c.address, c.nationality, c.idType, c.idNumber, c.createdAt, u.email, u.lastLoginAt, h.name
      ORDER BY c.firstName ASC, c.lastName ASC
      LIMIT ? OFFSET ?`,
      [vendorId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
    );
    
    // Get total count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN hotels h ON c.hotelId = h.id
      WHERE h.vendorId = ? 
        AND (
          c.firstName LIKE ? 
          OR c.lastName LIKE ? 
          OR CONCAT(c.firstName, ' ', COALESCE(c.lastName, '')) LIKE ?
          OR c.phone LIKE ?
          OR u.email LIKE ?
        )`,
      [vendorId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    
    const total = (countResult as any[])[0]?.total || 0;
    
    console.log(`[API] Found ${(customers as any[]).length} customers for search: "${search}"`);
    
    return NextResponse.json({
      customers: customers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('[API] Error searching customers:', error);
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}