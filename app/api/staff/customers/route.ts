import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { staffNotificationService } from '@/lib/services/staff-notification.service';
import bcrypt from 'bcrypt';

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

    if (!hotelId) {
      return NextResponse.json(
        { error: 'No hotel assigned to this staff member' },
        { status: 404 }
      );
    } 

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the main query to get customers with their booking statistics
    let query = `
      SELECT DISTINCT
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
        u.isActive,
        u.lastLoginAt,
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
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      WHERE (c.hotelId = ? OR c.hotelId IS NULL)
    `;

    const queryParams = [hotelId, hotelId];

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
    
    // Apply status filter after grouping for inactive customers
    if (status === 'inactive') {
      query += ` HAVING COUNT(b.id) = 0 AND u.isActive = 1`;
    } else if (status === 'active') {
      query += ` HAVING COUNT(b.id) > 0 AND u.isActive = 1`;
    }

    query += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [customersResults] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      WHERE (c.hotelId = ? OR c.hotelId IS NULL)
    `;

    const countParams = [hotelId, hotelId];

    if (search && search.trim()) {
      countQuery += ` AND (
        CONCAT(COALESCE(c.firstName, ''), ' ', COALESCE(c.lastName, '')) LIKE ? 
        OR c.phone LIKE ? 
        OR u.email LIKE ?
      )`;
      const searchPattern = `%${search.trim()}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        countQuery += ` AND u.isActive = 1`;
      } else if (status === 'blocked') {
        countQuery += ` AND u.isActive = 0`;
      }
    }

    const [countResults] = await pool.execute(countQuery, countParams);
    const totalCount = (countResults as any[])[0]?.total || 0;

    // Format the response data
    const customers = (customersResults as any[]).map((customer: any) => ({
      id: customer.id,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      nationality: customer.nationality || '',
      idType: customer.idType || '',
      idNumber: customer.idNumber || '',
      totalBookings: parseInt(customer.totalBookings) || 0,
      totalSpent: parseFloat(customer.totalSpent) || 0,
      lastBooking: customer.lastBooking,
      status: customer.status,
      createdAt: customer.createdAt,
      lastLoginAt: customer.lastLoginAt,
      displayName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() + 
                   (customer.phone ? ` - ${customer.phone}` : '') +
                   (customer.email ? ` (${customer.email})` : '')
    }));

    // Get summary statistics
    const [statsResults] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT c.id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 AND b.id IS NOT NULL THEN c.id END) as activeCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 AND b.id IS NULL THEN c.id END) as inactiveCustomers,
        COUNT(DISTINCT CASE WHEN u.isActive = 0 THEN c.id END) as blockedCustomers,
        COALESCE(SUM(CASE WHEN b.status NOT IN ('CANCELLED') THEN b.totalAmount ELSE 0 END), 0) as totalRevenue,
        COALESCE(AVG(booking_counts.booking_count), 0) as avgBookings
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      LEFT JOIN (
        SELECT customerId, COUNT(*) as booking_count
        FROM bookings 
        WHERE hotelId = ? AND status NOT IN ('CANCELLED')
        GROUP BY customerId
      ) booking_counts ON c.id = booking_counts.customerId
      WHERE (c.hotelId = ? OR c.hotelId IS NULL)
    `, [hotelId, hotelId, hotelId]);

    const stats = (statsResults as any[])[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
      blockedCustomers: 0,
      totalRevenue: 0,
      avgBookings: 0
    };

    return NextResponse.json({
      customers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        totalCustomers: parseInt(stats.totalCustomers) || 0,
        activeCustomers: parseInt(stats.activeCustomers) || 0,
        inactiveCustomers: parseInt(stats.inactiveCustomers) || 0,
        blockedCustomers: parseInt(stats.blockedCustomers) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        avgBookings: parseFloat(stats.avgBookings) || 0
      }
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
    const [existingCustomer] = await pool.execute(`
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
      const [existingUser] = await pool.execute(
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

      await pool.execute(`
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
    await pool.execute(`
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