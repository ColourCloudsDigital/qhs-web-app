import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { staffNotificationService } from '@/lib/services/staff-notification.service';
import bcrypt from 'bcrypt';

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

    // Get staff info to find their hotel AND vendorId
    const [staffResults] = await pool.query(
      'SELECT hotelId, vendorId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
    }

    const staff = staffResults[0] as any;
    const hotelId = staff.hotelId;
    const vendorId = staff.vendorId;

    if (!hotelId) {
      return NextResponse.json({ error: 'No hotel assigned to this staff member' }, { status: 404 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    // Scope customers to this vendor's hotels via bookings OR direct hotelId
    // A customer belongs to this vendor if they have a booking at any of the vendor's hotels
    // OR their hotelId matches this hotel
    let query = `
      SELECT DISTINCT
        c.id, c.firstName, c.lastName, c.phone, c.address,
        c.nationality, c.idType, c.idNumber, c.createdAt,
        u.email, u.isActive, u.lastLoginAt,
        COUNT(DISTINCT b.id) as totalBookings,
        COALESCE(SUM(CASE WHEN b.status NOT IN ('CANCELLED') THEN b.totalAmount ELSE 0 END), 0) as totalSpent,
        MAX(b.checkInDate) as lastBooking,
        CASE
          WHEN u.isActive = 1 AND COUNT(b.id) > 0 THEN 'active'
          WHEN u.isActive = 1 AND COUNT(b.id) = 0 THEN 'inactive'
          ELSE 'blocked'
        END as status
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId
      LEFT JOIN hotels h ON b.hotelId = h.id
      WHERE (
        c.hotelId = ?
        OR (h.vendorId = ? AND b.id IS NOT NULL)
      )
    `;
    const queryParams: any[] = [hotelId, vendorId];

    // Add search filter if provided
    if (search && search.trim()) {
      query += ` AND (
        CONCAT(COALESCE(c.firstName, ''), ' ', COALESCE(c.lastName, '')) LIKE ? 
        OR c.phone LIKE ? 
        OR u.email LIKE ?
      )`;
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      if (status === 'active') {
        query += ` AND u.isActive = 1`;
      } else if (status === 'inactive') {
        query += ` AND u.isActive = 1`;
      } else if (status === 'blocked') {
        query += ` AND u.isActive = 0`;
      }
    }

    query += ` GROUP BY c.id, c.firstName, c.lastName, c.phone, c.address, c.nationality, c.idType, c.idNumber, c.createdAt, u.email, u.isActive, u.lastLoginAt`;

    if (status === 'inactive') {
      query += ` HAVING COUNT(b.id) = 0 AND u.isActive = 1`;
    } else if (status === 'active') {
      query += ` HAVING COUNT(b.id) > 0 AND u.isActive = 1`;
    }

    query += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [customersResults] = await pool.query(query, queryParams);

    // Count query
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId
      LEFT JOIN hotels h ON b.hotelId = h.id
      WHERE (c.hotelId = ? OR (h.vendorId = ? AND b.id IS NOT NULL))
    `;
    const countParams: any[] = [hotelId, vendorId];

    if (search && search.trim()) {
      countQuery += ` AND (CONCAT(COALESCE(c.firstName,''),' ',COALESCE(c.lastName,'')) LIKE ? OR c.phone LIKE ? OR u.email LIKE ?)`;
      const sp = `%${search.trim()}%`;
      countParams.push(sp, sp, sp);
    }
    if (status === 'blocked') countQuery += ` AND u.isActive = 0`;
    else if (status === 'active' || status === 'inactive') countQuery += ` AND u.isActive = 1`;

    const [countResults] = await pool.query(countQuery, countParams);
    const totalCount = (countResults as any[])[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Stats scoped to vendor
    const [statsResults] = await pool.query(`
      SELECT
        COUNT(DISTINCT c.id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 AND b.id IS NOT NULL THEN c.id END) as activeCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 AND b.id IS NULL THEN c.id END) as inactiveCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 0 THEN c.id END) as blockedCustomers,
        COALESCE(SUM(CASE WHEN b.status NOT IN ('CANCELLED') THEN b.totalAmount ELSE 0 END), 0) as totalRevenue,
        COALESCE(AVG(bc.booking_count), 0) as avgBookings
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId
      LEFT JOIN hotels h ON b.hotelId = h.id
      LEFT JOIN (
        SELECT b2.customerId, COUNT(*) as booking_count
        FROM bookings b2
        JOIN hotels h2 ON b2.hotelId = h2.id
        WHERE h2.vendorId = ? AND b2.status NOT IN ('CANCELLED')
        GROUP BY b2.customerId
      ) bc ON c.id = bc.customerId
      WHERE (c.hotelId = ? OR (h.vendorId = ? AND b.id IS NOT NULL))
    `, [vendorId, hotelId, vendorId]);

    const stats = (statsResults as any[])[0] || {};

    return NextResponse.json({
      customers: (customersResults as any[]).map((c: any) => ({
        id: c.id,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        nationality: c.nationality || '',
        idType: c.idType || '',
        idNumber: c.idNumber || '',
        totalBookings: parseInt(c.totalBookings) || 0,
        totalSpent: parseFloat(c.totalSpent) || 0,
        lastBooking: c.lastBooking,
        status: c.status,
        createdAt: c.createdAt,
        lastLoginAt: c.lastLoginAt,
      })),
      pagination: { total: totalCount, page, limit, totalPages },
      stats: {
        totalCustomers: parseInt(stats.totalCustomers) || 0,
        activeCustomers: parseInt(stats.activeCustomers) || 0,
        inactiveCustomers: parseInt(stats.inactiveCustomers) || 0,
        blockedCustomers: parseInt(stats.blockedCustomers) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        avgBookings: parseFloat(stats.avgBookings) || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      'SELECT hotelId, vendorId FROM staff WHERE userId = ?',
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

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      nationality,
      idType,
      idNumber
    } = body;

    // Validate required fields
    if (!firstName || !phone) {
      return NextResponse.json(
        { error: 'First name and phone are required' },
        { status: 400 }
      );
    }

    // Check if customer with this phone already exists for this hotel
    const [existingCustomer] = await pool.query(`
      SELECT c.id FROM customers c
      LEFT JOIN bookings b ON c.id = b.customerId
      WHERE c.phone = ? AND (c.hotelId = ? OR b.hotelId = ?)
      LIMIT 1
    `, [phone, hotelId, hotelId]);

    if (Array.isArray(existingCustomer) && existingCustomer.length > 0) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      );
    }

    // Generate customer ID
    const customerId = require('crypto').randomUUID();

    // Create user account if email is provided
    let userId = null;
    if (email) {
      // Check if user with this email already exists
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (Array.isArray(existingUser) && existingUser.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      userId = require('crypto').randomUUID();
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('defaultpassword123', 10);

      await pool.query(`
        INSERT INTO users (id, name, firstName, lastName, email, password, role, isActive, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 'CUSTOMER', 1, NOW())
      `, [
        userId,
        `${firstName} ${lastName || ''}`.trim(),
        firstName,
        lastName || null,
        email,
        hashedPassword
      ]);
    }

    // Create customer record
    await pool.query(`
      INSERT INTO customers (id, firstName, lastName, userId, hotelId, phone, address, nationality, idType, idNumber, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      customerId,
      firstName,
      lastName || null,
      userId,
      hotelId,
      phone,
      address || null,
      nationality || null,
      idType || null,
      idNumber || null
    ]);

    // Send notification about new customer
    try {
      await staffNotificationService.notifyCustomerCreated({
        name: `${firstName} ${lastName || ''}`.trim(),
        email: email || '',
        hotelId
      }, session.user.id);
    } catch (notificationError) {
      console.error('Failed to send customer creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // If additional fields are provided, we could extend the customers table or create a customer_details table
    // For now, we'll return the created customer

    return NextResponse.json({
      success: true,
      customer: {
        id: customerId,
        firstName,
        lastName: lastName || '',
        email: email || '',
        phone,
        address: address || '',
        totalBookings: 0,
        totalSpent: 0,
        status: 'inactive',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
