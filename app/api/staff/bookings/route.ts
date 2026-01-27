import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get staff info to find their hotel
    const [staffResults] = await pool.query(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = (staffResults as any[])[0];
    const hotelId = staff.hotelId;

    // Build WHERE clause
    let whereClause = 'WHERE b.hotelId = ?';
    const queryParams: any[] = [hotelId];

    if (status && status !== 'all') {
      whereClause += ' AND b.status = ?';
      queryParams.push(status);
    }

    if (search) {
      whereClause += ' AND (CONCAT(c.firstName, " ", c.lastName) LIKE ? OR b.id LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (checkInDate) {
      whereClause += ' AND b.checkInDate >= ?';
      queryParams.push(checkInDate);
    }

    if (checkOutDate) {
      whereClause += ' AND b.checkOutDate <= ?';
      queryParams.push(checkOutDate);
    }

    // Build ORDER BY clause
    const validSortColumns = ['createdAt', 'checkInDate', 'checkOutDate', 'totalAmount', 'status'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN room_units ru ON b.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      LEFT JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      ${whereClause}
    `;

    const [countResults] = await pool.query(countQuery, queryParams);
    const total = (countResults as any[])[0].total;

    // Get bookings with pagination
    const bookingsQuery = `
      SELECT 
        b.id,
        b.checkInDate,
        b.checkOutDate,
        b.numberOfGuests,
        b.totalAmount,
        b.status,
        b.paymentStatus,
        b.createdAt,
        b.updatedAt,
        h.id as hotelId,
        h.name as hotelName,
        ru.id as roomUnitId,
        ru.roomNumber,
        r.id as roomId,
        r.name as roomName,
        r.type as roomType,
        c.id as customerId,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        c.phone as customerPhone
      FROM bookings b
      LEFT JOIN hotels h ON b.hotelId = h.id
      LEFT JOIN room_units ru ON b.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      LEFT JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      ${whereClause}
      ORDER BY b.${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, (page - 1) * limit);
    const [bookingsResults] = await pool.query(bookingsQuery, queryParams);

    // Format bookings data
    const bookings = (bookingsResults as any[]).map((booking: any) => ({
      id: booking.id,
      hotel: {
        id: booking.hotelId,
        name: booking.hotelName,
      },
      room: {
        id: booking.roomId,
        name: booking.roomName,
        type: booking.roomType,
      },
      roomUnit: {
        id: booking.roomUnitId,
        roomNumber: booking.roomNumber,
      },
      customer: {
        id: booking.customerId,
        name: booking.customerName,
        phone: booking.customerPhone,
      },
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfGuests: booking.numberOfGuests,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    
    const statsQuery = `
      SELECT 
        COUNT(*) as totalBookings,
        SUM(CASE WHEN DATE(b.checkInDate) = ? THEN 1 ELSE 0 END) as todayCheckIns,
        SUM(CASE WHEN DATE(b.checkOutDate) = ? THEN 1 ELSE 0 END) as todayCheckOuts,
        SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pendingBookings,
        SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmedBookings,
        SUM(CASE WHEN b.status = 'CHECKED_IN' THEN 1 ELSE 0 END) as checkedInBookings,
        SUM(b.totalAmount) as totalRevenue
      FROM bookings b
      WHERE b.hotelId = ?
    `;

    const [statsResults] = await pool.query(statsQuery, [today, today, hotelId]);
    const stats = (statsResults as any[])[0];

    return NextResponse.json({
      bookings,
      stats: {
        totalBookings: stats.totalBookings || 0,
        todayCheckIns: stats.todayCheckIns || 0,
        todayCheckOuts: stats.todayCheckOuts || 0,
        pendingBookings: stats.pendingBookings || 0,
        confirmedBookings: stats.confirmedBookings || 0,
        checkedInBookings: stats.checkedInBookings || 0,
        totalRevenue: stats.totalRevenue || 0,
      },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Error fetching staff bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}