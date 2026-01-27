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

    // Get staff info to find their hotel and check permissions
    const [staffResults] = await pool.execute(
      'SELECT s.*, h.name as hotelName FROM staff s JOIN hotels h ON s.hotelId = h.id WHERE s.userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const currentStaff = staffResults[0] as any;
    const permissions = JSON.parse(currentStaff.permissions || '[]');

    // Check if user has staff management permission
    if (!permissions.includes('staff')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const hotelId = currentStaff.hotelId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const position = searchParams.get('position');
    const status = searchParams.get('status');

    // Get all staff for the hotel with their user information and statistics
    let query = `
      SELECT 
        s.id,
        s.userId,
        s.position,
        s.permissions,
        s.createdAt,
        s.updatedAt,
        u.name,
        u.firstName,
        u.lastName,
        u.email,
        u.isActive,
        u.lastLoginAt,
        COUNT(DISTINCT t.taskId) as totalTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.taskId END) as completedTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'PENDING' THEN t.taskId END) as pendingTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'IN_PROGRESS' THEN t.taskId END) as inProgressTasks
      FROM staff s
      JOIN users u ON s.userId = u.id
      LEFT JOIN facility_tasks t ON s.id = t.staffId
      WHERE s.hotelId = ?
    `;

    const queryParams = [hotelId];

    // Add search filter
    if (search && search.trim()) {
      query += ` AND (
        u.name LIKE ? OR 
        u.email LIKE ? OR 
        s.position LIKE ?
      )`;
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Add position filter
    if (position && position !== 'all') {
      query += ` AND s.position = ?`;
      queryParams.push(position);
    }

    // Add status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query += ` AND u.isActive = 1`;
      } else if (status === 'inactive') {
        query += ` AND u.isActive = 0`;
      }
    }

    query += ` GROUP BY s.id, s.userId, s.position, s.permissions, s.createdAt, s.updatedAt, u.name, u.firstName, u.lastName, u.email, u.isActive, u.lastLoginAt`;
    query += ` ORDER BY s.createdAt DESC`;

    const [staffList] = await pool.execute(query, queryParams);

    // Get summary statistics
    const [statsResults] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT s.id) as totalStaff,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 THEN s.id END) as activeStaff,
        COUNT(DISTINCT CASE WHEN u.isActive = 0 THEN s.id END) as inactiveStaff,
        COUNT(DISTINCT s.position) as totalPositions,
        COUNT(DISTINCT t.taskId) as totalTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.taskId END) as completedTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'PENDING' THEN t.taskId END) as pendingTasks
      FROM staff s
      JOIN users u ON s.userId = u.id
      LEFT JOIN facility_tasks t ON s.id = t.staffId
      WHERE s.hotelId = ?
    `, [hotelId]);

    // Format staff data
    const formattedStaff = (staffList as any[]).map((staff: any) => ({
      id: staff.id,
      userId: staff.userId,
      name: staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      email: staff.email,
      position: staff.position,
      permissions: JSON.parse(staff.permissions || '[]'),
      isActive: staff.isActive === 1,
      lastLoginAt: staff.lastLoginAt,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      stats: {
        totalTasks: parseInt(staff.totalTasks) || 0,
        completedTasks: parseInt(staff.completedTasks) || 0,
        pendingTasks: parseInt(staff.pendingTasks) || 0,
        inProgressTasks: parseInt(staff.inProgressTasks) || 0,
        totalBookings: 0, // Remove booking stats since there's no direct relationship
        totalRevenue: 0   // Remove revenue stats since there's no direct relationship
      }
    }));

    const stats = (statsResults as any[])[0] || {};

    return NextResponse.json({
      staff: formattedStaff,
      stats: {
        totalStaff: parseInt(stats.totalStaff) || 0,
        activeStaff: parseInt(stats.activeStaff) || 0,
        inactiveStaff: parseInt(stats.inactiveStaff) || 0,
        totalPositions: parseInt(stats.totalPositions) || 0,
        totalTasks: parseInt(stats.totalTasks) || 0,
        completedTasks: parseInt(stats.completedTasks) || 0,
        pendingTasks: parseInt(stats.pendingTasks) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
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

    // Get staff info and check permissions
    const [staffResults] = await pool.execute(
      'SELECT s.*, h.name as hotelName FROM staff s JOIN hotels h ON s.hotelId = h.id WHERE s.userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const currentStaff = staffResults[0] as any;
    const permissions = JSON.parse(currentStaff.permissions || '[]');

    if (!permissions.includes('staff')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      position,
      selectedPermissions
    } = body;

    // Validate required fields
    if (!firstName || !email || !password || !position) {
      return NextResponse.json(
        { error: 'First name, email, password, and position are required' },
        { status: 400 }
      );
    }

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

    // Generate IDs
    const userId = require('crypto').randomUUID();
    const staffId = require('crypto').randomUUID();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    await pool.execute(`
      INSERT INTO users (id, name, firstName, lastName, email, password, role, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 'STAFF', 1, NOW())
    `, [
      userId,
      `${firstName} ${lastName || ''}`.trim(),
      firstName,
      lastName || null,
      email,
      hashedPassword
    ]);

    // Create staff record
    await pool.execute(`
      INSERT INTO staff (id, userId, vendorId, hotelId, position, permissions, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      staffId,
      userId,
      currentStaff.vendorId,
      currentStaff.hotelId,
      position,
      JSON.stringify(selectedPermissions || [])
    ]);

    // Send notification about new staff member
    try {
      await staffNotificationService.notifyStaffCreated({
        name: `${firstName} ${lastName || ''}`.trim(),
        position,
        hotelId: currentStaff.hotelId
      }, session.user.id);
    } catch (notificationError) {
      console.error('Failed to send staff creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staffId,
        userId,
        name: `${firstName} ${lastName || ''}`.trim(),
        firstName,
        lastName: lastName || '',
        email,
        position,
        permissions: selectedPermissions || [],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}