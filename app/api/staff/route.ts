import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    
    // Either hotelId or vendorId should be provided
    if (!hotelId && !vendorId) {
      return NextResponse.json({ error: 'Hotel ID or Vendor ID is required' }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;

    // Build the WHERE clause based on the new staff table schema
    let whereClause = '';
    const params: any[] = [];

    if (hotelId) {
      whereClause = 'WHERE s.hotelId = ?';
      params.push(hotelId);
    } else if (vendorId) {
      whereClause = 'WHERE s.vendorId = ?';
      params.push(vendorId);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND u.isActive = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND u.isActive = 0';
      }
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM staff s
       JOIN users u ON s.userId = u.id
       ${whereClause}`,
      params
    ) as [RowDataPacket[], any];

    const totalItems = countResult[0]?.total || 0;

    // Get staff with pagination - updated to match new schema
    const [staff] = await pool.query(
      `SELECT 
        s.id,
        s.userId,
        s.vendorId,
        s.hotelId,
        s.position,
        s.permissions,
        u.name,
        u.firstName,
        u.lastName,
        u.email,
        u.isActive,
        u.createdAt,
        h.name as hotelName,
        v.companyName as vendorName
       FROM staff s
       JOIN users u ON s.userId = u.id
       LEFT JOIN hotels h ON s.hotelId = h.id
       LEFT JOIN vendors v ON s.vendorId = v.id
       ${whereClause}
       ORDER BY u.name ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as [RowDataPacket[], any];

    // Format the response
    const formattedStaff = (staff || []).map((member: any) => ({
      id: member.id,
      name: member.name,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      position: member.position,
      permissions: member.permissions ? JSON.parse(member.permissions) : [],
      isActive: Boolean(member.isActive),
      userId: member.userId,
      vendorId: member.vendorId,
      hotelId: member.hotelId,
      hotelName: member.hotelName,
      vendorName: member.vendorName,
      createdAt: member.createdAt,
    }));

    return NextResponse.json({
      data: formattedStaff,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, staffData } = body;

    // Handle staff creation
    if (action === 'create') {
      const { 
        name, 
        firstName, 
        lastName, 
        email, 
        password, 
        position, 
        vendorId, 
        hotelId, 
        permissions 
      } = staffData;

      if (!name || !email || !password || !position || !vendorId) {
        return NextResponse.json({ 
          error: 'Name, email, password, position, and vendor ID are required' 
        }, { status: 400 });
      }

      // Check if user already exists
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as [RowDataPacket[], any];

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' }, 
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = crypto.randomUUID();
      const staffId = crypto.randomUUID();

      // Create user account
      await pool.query(
        `INSERT INTO users (id, name, firstName, lastName, email, password, role, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'STAFF', 1, NOW(), NOW())`,
        [userId, name, firstName || null, lastName || null, email, hashedPassword]
      );

      // Create staff record
      await pool.query(
        `INSERT INTO staff (id, userId, vendorId, hotelId, position, permissions, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [staffId, userId, vendorId, hotelId || null, position, JSON.stringify(permissions || [])]
      );

      return NextResponse.json({
        success: true,
        message: 'Staff member created successfully',
        staff: { id: staffId, userId }
      });
    }

    // Handle bulk actions
    if (!action || !ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    switch (action) {
      case 'activate':
        await pool.query(
          `UPDATE users u 
           JOIN staff s ON u.id = s.userId 
           SET u.isActive = 1 
           WHERE s.id IN (${ids.map(() => '?').join(',')})`,
          ids
        );
        break;
      
      case 'deactivate':
        await pool.query(
          `UPDATE users u 
           JOIN staff s ON u.id = s.userId 
           SET u.isActive = 0 
           WHERE s.id IN (${ids.map(() => '?').join(',')})`,
          ids
        );
        break;
      
      case 'delete':
        // First delete from staff table, then from users table
        await pool.query(
          `DELETE s, u FROM staff s 
           JOIN users u ON s.userId = u.id 
           WHERE s.id IN (${ids.map(() => '?').join(',')})`,
          ids
        );
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error performing staff action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}