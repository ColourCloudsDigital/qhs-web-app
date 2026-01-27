import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { UserRole } from '@/lib/types/enums';
import { staffNotificationService } from '@/lib/services/staff-notification.service';

// GET /api/staff/tasks/[id] - Get specific task details for staff
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Only staff can access this endpoint' }, { status: 403 });
    }

    const taskId = params.id;

    // Get staff ID from user ID
    const [staffRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, vendorId, hotelId FROM staff WHERE userId = ?`,
      [session.user.id]
    );

    if (staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    const staff = staffRows[0];

    // Get task details
    const [taskRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ft.taskId,
        ft.title,
        ft.description,
        ft.status,
        ft.priority,
        ft.category,
        ft.due_date as dueDate,
        ft.created_at as createdAt,
        ft.updated_at as updatedAt,
        ft.created_at as completedAt,
        ft.estimated_hours as estimatedHours,
        ft.cost_estimate as actualHours,
        ft.cost_estimate as costEstimate,
        ft.cost_estimate as actualCost,
        ft.roomUnitId as roomId,
        ft.hotelId,
        ft.staffId as assignedTo,
        h.name as hotelName,
        creator.name as createdByName,
        creator.email as createdByEmail
      FROM facility_tasks ft
      LEFT JOIN hotels h ON ft.hotelId = h.id
      LEFT JOIN staff creator_staff ON ft.staffId = creator_staff.id
      LEFT JOIN users creator ON creator_staff.userId = creator.id
      WHERE ft.taskId = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskRows[0];

    // Check if staff has access to this task (must be assigned to them)
    if (task.assignedTo !== staff.id) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Get task comments
    const [commentRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        tc.commentId,
        tc.comment_text,
        tc.created_at,
        u.name as authorName,
        s.position as authorPosition
      FROM task_comments tc
      JOIN staff s ON tc.staffId = s.id
      JOIN users u ON s.userId = u.id
      WHERE tc.taskId = ?
      ORDER BY tc.created_at ASC`,
      [taskId]
    );

    // Format task for response
    const taskData = {
      id: task.taskId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      costEstimate: task.costEstimate,
      actualCost: task.actualCost,
      room: task.roomId ? {
        id: task.roomId,
        name: `Room Unit ${task.roomId}`
      } : null,
      hotel: task.hotelId ? {
        id: task.hotelId,
        name: task.hotelName
      } : null,
      createdBy: {
        name: task.createdByName || 'Unknown',
        email: task.createdByEmail || ''
      },
      comments: commentRows.map(comment => ({
        id: comment.commentId,
        content: comment.comment_text,
        createdAt: comment.created_at,
        user: {
          name: comment.authorName,
          position: comment.authorPosition
        }
      })),
      checklist: [] // TODO: Implement checklist if needed
    };

    return NextResponse.json({ task: taskData });

  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task details' },
      { status: 500 }
    );
  }
}

// PUT /api/staff/tasks/[id] - Update task status and other fields
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Only staff can update tasks' }, { status: 403 });
    }

    const taskId = params.id;
    const { status, actualHours, completedAt } = await request.json();

    // Get staff ID from user ID
    const [staffRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM staff WHERE userId = ?`,
      [session.user.id]
    );

    if (staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    const staffId = staffRows[0].id;

    // Verify task exists and staff has access
    const [taskRows] = await pool.query<RowDataPacket[]>(
      `SELECT ft.staffId as assignedTo, ft.title, ft.hotelId FROM facility_tasks ft WHERE ft.taskId = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskRows[0];

    if (task.assignedTo !== staffId) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (actualHours !== undefined) {
      updates.push('cost_estimate = ?');
      values.push(actualHours);
    }

    if (completedAt) {
      updates.push('created_at = ?');
      values.push(completedAt);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(taskId);

    // Update the task
    await pool.query(
      `UPDATE facility_tasks SET ${updates.join(', ')} WHERE taskId = ?`,
      values
    );

    // Send notification if task was completed
    if (status === 'COMPLETED') {
      try {
        await staffNotificationService.notifyTaskCompleted({
          title: task.title,
          completedBy: session.user.id,
          hotelId: task.hotelId
        });
      } catch (notificationError) {
        console.error('Failed to send task completion notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ message: 'Task updated successfully' });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}