import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current staff info and check permissions
    const [currentStaffResults] = await pool.execute(
      'SELECT s.*, h.name as hotelName FROM staff s JOIN hotels h ON s.hotelId = h.id WHERE s.userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(currentStaffResults) || currentStaffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const currentStaff = currentStaffResults[0] as any;
    const permissions = JSON.parse(currentStaff.permissions || '[]');

    if (!permissions.includes('staff')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { staffId } = params;
    const hotelId = currentStaff.hotelId;

    // Get detailed staff information
    const [staffResults] = await pool.execute(`
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
      WHERE s.id = ? AND s.hotelId = ?
      GROUP BY s.id, s.userId, s.position, s.permissions, s.createdAt, s.updatedAt, u.name, u.firstName, u.lastName, u.email, u.isActive, u.lastLoginAt
    `, [staffId, hotelId]);

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    const staff = staffResults[0] as any;

    // Get recent tasks
    const [tasksResults] = await pool.execute(`
      SELECT 
        t.taskId,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.due_date,
        t.status,
        t.created_at,
        t.updated_at,
        ru.roomNumber,
        r.name as roomName
      FROM facility_tasks t
      LEFT JOIN room_units ru ON t.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      WHERE t.staffId = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [staffId]);

    // Get recent bookings - since there's no direct relationship, we'll get bookings from the same hotel
    const [bookingsResults] = await pool.execute(`
      SELECT 
        b.id,
        b.checkInDate,
        b.checkOutDate,
        b.totalAmount,
        b.status,
        b.createdAt,
        u.name as customerName,
        r.name as roomName,
        ru.roomNumber
      FROM bookings b
      JOIN users u ON b.customerId = u.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      WHERE b.hotelId = ?
      ORDER BY b.createdAt DESC
      LIMIT 5
    `, [hotelId]);

    // Format the response
    const staffData = {
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
        totalBookings: 0, // Remove direct booking relationship
        totalRevenue: 0   // Remove direct revenue relationship
      },
      tasks: (tasksResults as any[]).map((task: any) => ({
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        dueDate: task.due_date,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        roomNumber: task.roomNumber,
        roomName: task.roomName
      })),
      bookings: (bookingsResults as any[]).map((booking: any) => ({
        id: booking.id,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: parseFloat(booking.totalAmount),
        status: booking.status,
        createdAt: booking.createdAt,
        customerName: booking.customerName,
        roomName: booking.roomName,
        roomNumber: booking.roomNumber
      }))
    };

    return NextResponse.json({ staff: staffData });

  } catch (error) {
    console.error('Error fetching staff details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current staff info and check permissions
    const [currentStaffResults] = await pool.execute(
      'SELECT s.*, h.name as hotelName FROM staff s JOIN hotels h ON s.hotelId = h.id WHERE s.userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(currentStaffResults) || currentStaffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const currentStaff = currentStaffResults[0] as any;
    const permissions = JSON.parse(currentStaff.permissions || '[]');

    if (!permissions.includes('staff')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { staffId } = params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      position,
      selectedPermissions,
      isActive
    } = body;

    // Verify staff exists and belongs to same hotel
    const [staffCheck] = await pool.execute(`
      SELECT s.userId FROM staff s
      WHERE s.id = ? AND s.hotelId = ?
    `, [staffId, currentStaff.hotelId]);

    if (!Array.isArray(staffCheck) || staffCheck.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    const targetStaff = staffCheck[0] as any;

    // Update user record
    await pool.execute(`
      UPDATE users 
      SET name = ?, firstName = ?, lastName = ?, email = ?, isActive = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      `${firstName} ${lastName || ''}`.trim(),
      firstName,
      lastName || null,
      email,
      isActive ? 1 : 0,
      targetStaff.userId
    ]);

    // Update staff record
    await pool.execute(`
      UPDATE staff 
      SET position = ?, permissions = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      position,
      JSON.stringify(selectedPermissions || []),
      staffId
    ]);

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully'
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}