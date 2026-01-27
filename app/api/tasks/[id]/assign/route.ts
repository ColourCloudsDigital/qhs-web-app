import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';

interface StaffRow extends RowDataPacket {
  id: string;
  hotelId: string;
  userId: string;
  name: string;
  email: string;
}

interface TaskRow extends RowDataPacket {
  id: string;
  hotelId: string;
  assignedToId: string | null;
  title: string;
}

const assignSchema = z.object({
  assignedToId: z.string().nullable()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Check module access
    const hasAccess = await canAccessModule(
      session.user.id,
      ModuleType.FACILITY_MANAGEMENT
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Module access not included in your subscription plan' },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const { assignedToId } = assignSchema.parse(body);

    // Get the task
    const [taskRows] = await pool.query<RowDataPacket[]>(
      `SELECT taskId as id, hotelId, staffId as assignedToId, title FROM facility_tasks WHERE taskId = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskRows[0] as TaskRow;

    // Handle unassignment
    if (!assignedToId || assignedToId === 'unassigned') {
      // Skip update if already unassigned
      if (!task.assignedToId) {
        return NextResponse.json({ message: 'Task is already unassigned' });
      }

      // Update the task to unassign
      await pool.query(
        `UPDATE facility_tasks SET staffId = NULL, updated_at = NOW() WHERE taskId = ?`,
        [taskId]
      );

      return NextResponse.json({
        message: 'Task unassigned successfully',
        task: {
          id: task.id,
          assignedToId: null,
          assignedTo: null
        }
      });
    }

    // Get staff member with user info
    const [staffRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.hotelId, s.userId, u.name, u.email 
       FROM staff s
       JOIN users u ON s.userId = u.id
       WHERE s.id = ?`,
      [assignedToId]
    );

    if (staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const staff = staffRows[0] as StaffRow;

    // Ensure staff belongs to the same hotel as the task
    if (staff.hotelId !== task.hotelId) {
      return NextResponse.json(
        { error: 'Staff must belong to the same hotel as the task' },
        { status: 400 }
      );
    }

    // Skip update if already assigned to this staff
    if (task.assignedToId === assignedToId) {
      return NextResponse.json({ message: 'Task already assigned to this staff' });
    }

    // Update the task with the new assignee
    await pool.query(
      `UPDATE facility_tasks SET staffId = ?, updated_at = NOW() WHERE taskId = ?`,
      [assignedToId, taskId]
    );

    // Create a notification for the staff member
    try {
      await pool.query(
        `INSERT INTO notifications 
         (title, content, type, status, recipient, recipientId, senderId, metadata, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          `Task Assigned: ${task.title}`,
          `You have been assigned a new task: ${task.title}`,
          'TASK',
          'UNREAD',
          'USER',
          staff.userId,
          session.user.id,
          JSON.stringify({ taskId: task.id }),
        ]
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Fetch and return updated task
    const [updatedTaskRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ft.taskId as id,
        ft.title,
        ft.description,
        ft.status,
        ft.priority,
        ft.category,
        ft.hotelId,
        ft.roomUnitId,
        ft.staffId as assignedToId,
        ft.vendorId as createdById,
        ft.created_at as createdAt,
        ft.updated_at as updatedAt,
        ft.due_date as dueDate,
        ft.estimated_hours as estimatedHours,
        ft.cost_estimate as costEstimate,
        ft.maintenance_type as maintenanceType,
        ft.is_recurring as isRecurring,
        s.id as assignedToStaffId,
        u.name as assignedToName,
        u.email as assignedToEmail,
        u.id as assignedToUserId,
        st.position as assignedToPosition
       FROM facility_tasks ft
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       LEFT JOIN staff st ON s.id = st.id
       WHERE ft.taskId = ?`,
      [taskId]
    );

    if (updatedTaskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found after update' }, { status: 404 });
    }

    const updatedTask = updatedTaskRows[0];

    return NextResponse.json({
      message: 'Task assigned successfully',
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        category: updatedTask.category,
        hotelId: updatedTask.hotelId,
        roomUnitId: updatedTask.roomUnitId,
        assignedToId: updatedTask.assignedToId,
        assignedTo: updatedTask.assignedToId ? {
          id: updatedTask.assignedToId,
          userId: updatedTask.assignedToUserId,
          position: updatedTask.assignedToPosition,
          user: {
            id: updatedTask.assignedToUserId,
            name: updatedTask.assignedToName,
            email: updatedTask.assignedToEmail,
          },
        } : null,
        createdById: updatedTask.createdById,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
        dueDate: updatedTask.dueDate,
        estimatedHours: updatedTask.estimatedHours,
        costEstimate: updatedTask.costEstimate,
        maintenanceType: updatedTask.maintenanceType,
        isRecurring: updatedTask.isRecurring,
      }
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}