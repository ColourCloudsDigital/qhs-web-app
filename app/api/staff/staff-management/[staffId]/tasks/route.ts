import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { staffNotificationService } from '@/lib/services/staff-notification.service';

export async function POST(
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

    if (!permissions.includes('staff') && !permissions.includes('tasks')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { staffId } = params;
    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      dueDate,
      roomUnitId,
      maintenanceType,
      estimatedHours,
      costEstimate,
      isRecurring
    } = body;

    // Validate required fields
    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    // Verify staff exists and belongs to same hotel
    const [staffCheck] = await pool.execute(`
      SELECT s.id FROM staff s
      WHERE s.id = ? AND s.hotelId = ?
    `, [staffId, currentStaff.hotelId]);

    if (!Array.isArray(staffCheck) || staffCheck.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Generate task ID
    const taskId = require('crypto').randomUUID();

    // Create task
    await pool.execute(`
      INSERT INTO facility_tasks (
        taskId, hotelId, title, description, category, priority, due_date,
        staffId, vendorId, roomUnitId, maintenance_type, estimated_hours,
        cost_estimate, is_recurring, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())
    `, [
      taskId,
      currentStaff.hotelId,
      title,
      description || null,
      category || 'General',
      priority || 'MEDIUM',
      dueDate,
      staffId,
      currentStaff.vendorId,
      roomUnitId || null,
      maintenanceType || 'CORRECTIVE',
      estimatedHours || null,
      costEstimate || null,
      isRecurring ? 1 : 0
    ]);

    // Send notification to the assigned staff member
    try {
      await staffNotificationService.notifyTaskAssigned({
        title,
        staffId,
        assignedBy: session.user.id,
        dueDate
      });
    } catch (notificationError) {
      console.error('Failed to send task assignment notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      task: {
        taskId,
        title,
        description,
        category: category || 'General',
        priority: priority || 'MEDIUM',
        dueDate,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error assigning task:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}

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

    if (!permissions.includes('staff') && !permissions.includes('tasks')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { staffId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Get tasks for the specific staff member
    let query = `
      SELECT 
        t.taskId,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.due_date,
        t.status,
        t.maintenance_type,
        t.estimated_hours,
        t.cost_estimate,
        t.is_recurring,
        t.created_at,
        t.updated_at,
        ru.roomNumber,
        r.name as roomName
      FROM facility_tasks t
      LEFT JOIN room_units ru ON t.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      WHERE t.staffId = ? AND t.hotelId = ?
    `;

    const queryParams = [staffId, currentStaff.hotelId];

    // Add filters
    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      queryParams.push(status);
    }

    if (priority && priority !== 'all') {
      query += ` AND t.priority = ?`;
      queryParams.push(priority);
    }

    query += ` ORDER BY t.created_at DESC`;

    const [tasksResults] = await pool.execute(query, queryParams);

    const tasks = (tasksResults as any[]).map((task: any) => ({
      taskId: task.taskId,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      dueDate: task.due_date,
      status: task.status,
      maintenanceType: task.maintenance_type,
      estimatedHours: task.estimated_hours,
      costEstimate: task.cost_estimate,
      isRecurring: task.is_recurring === 1,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      roomNumber: task.roomNumber,
      roomName: task.roomName
    }));

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error('Error fetching staff tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff tasks' },
      { status: 500 }
    );
  }
}