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

    // Get staff info to find their hotel
    const [staffResults] = await pool.execute(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = staffResults[0] as any;
    const hotelId = staff.hotelId;

    // Get comprehensive customer statistics
    const [statsResults] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT c.id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 AND b.id IS NOT NULL THEN c.id END) as activeCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 AND b.id IS NULL THEN c.id END) as inactiveCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 0 THEN c.id END) as blockedCustomers,
        COALESCE(SUM(CASE WHEN b.status NOT IN ('CANCELLED') THEN b.totalAmount ELSE 0 END), 0) as totalRevenue,
        COUNT(DISTINCT b.id) as totalBookings,
        COALESCE(AVG(booking_counts.booking_count), 0) as avgBookings,
        COUNT(DISTINCT CASE WHEN DATE(c.createdAt) = CURDATE() THEN c.id END) as newCustomersToday,
        COUNT(DISTINCT CASE WHEN DATE(c.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN c.id END) as newCustomersThisWeek,
        COUNT(DISTINCT CASE WHEN DATE(c.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.id END) as newCustomersThisMonth
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      LEFT JOIN (
        SELECT customerId, COUNT(*) as booking_count
        FROM bookings 
        WHERE hotelId = ? AND status NOT IN ('CANCELLED')
        GROUP BY customerId
      ) booking_counts ON c.id = booking_counts.customerId
    `, [hotelId, hotelId]);

    // Get top customers by spending
    const [topCustomersResults] = await pool.execute(`
      SELECT 
        c.id,
        c.firstName,
        c.lastName,
        c.phone,
        COALESCE(SUM(CASE WHEN b.status NOT IN ('CANCELLED') THEN b.totalAmount ELSE 0 END), 0) as totalSpent,
        COUNT(DISTINCT b.id) as totalBookings
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      GROUP BY c.id, c.firstName, c.lastName, c.phone
      HAVING totalSpent > 0
      ORDER BY totalSpent DESC
      LIMIT 5
    `, [hotelId]);

    // Get customer growth over time (last 12 months)
    const [growthResults] = await pool.execute(`
      SELECT 
        DATE_FORMAT(c.createdAt, '%Y-%m') as month,
        COUNT(*) as newCustomers
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      WHERE c.createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(c.createdAt, '%Y-%m')
      ORDER BY month ASC
    `, [hotelId]);

    const stats = (statsResults as any[])[0] || {};
    const topCustomers = (topCustomersResults as any[]).map((customer: any) => ({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      phone: customer.phone,
      totalSpent: parseFloat(customer.totalSpent) || 0,
      totalBookings: parseInt(customer.totalBookings) || 0
    }));

    const growth = (growthResults as any[]).map((item: any) => ({
      month: item.month,
      newCustomers: parseInt(item.newCustomers) || 0
    }));

    return NextResponse.json({
      stats: {
        totalCustomers: parseInt(stats.totalCustomers) || 0,
        activeCustomers: parseInt(stats.activeCustomers) || 0,
        inactiveCustomers: parseInt(stats.inactiveCustomers) || 0,
        blockedCustomers: parseInt(stats.blockedCustomers) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        totalBookings: parseInt(stats.totalBookings) || 0,
        avgBookings: parseFloat(stats.avgBookings) || 0,
        newCustomersToday: parseInt(stats.newCustomersToday) || 0,
        newCustomersThisWeek: parseInt(stats.newCustomersThisWeek) || 0,
        newCustomersThisMonth: parseInt(stats.newCustomersThisMonth) || 0
      },
      topCustomers,
      growth
    });

  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer statistics' },
      { status: 500 }
    );
  }
}