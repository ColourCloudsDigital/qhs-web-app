import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType, TaskStatus } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';

// Schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  estimatedHours: z.number().positive().optional(),
  costEstimate: z.number().nonnegative().optional(),
  roomId: z.string().uuid().nullable().optional(),
  maintenanceType: z.string().optional(),
  isRecurring: z.boolean().optional(),
  attachments: z.string().optional(), // JSON string of URLs
  notes: z.string().optional(), // Additional notes for status changes
});

// Helper to check task access permission
async function canAccessTask(userId: string, taskId: string) {
  try {
    // Get user with vendor/staff info
    const userResult = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.role, v.id as vendorId, s.id as staffId, s.hotelId as staffHotelId
       FROM users u
       LEFT JOIN vendors v ON u.id = v.userId
       LEFT JOIN staff s ON u.id = s.userId
       WHERE u.id = ?`,
      [userId]
    );

    if (userResult[0].length === 0) return false;
    const user = userResult[0][0];

    // Get task info
    const taskResult = await pool.query<RowDataPacket[]>(
      `SELECT taskId as id, hotelId, staffId as assignedToId, vendorId as createdById FROM facility_tasks WHERE taskId = ?`,
      [taskId]
    );

    if (taskResult[0].length === 0) return false;
    const task = taskResult[0][0];

    // Super admin has access
    if (user.role === 'SUPER_ADMIN') return true;

    // Vendor can access if:
    // 1. They created the task (task.createdById === user.vendorId)
    // 2. Task is in one of their hotels
    if (user.role === 'VENDOR' && user.vendorId) {
      // Check if vendor created the task
      if (task.createdById === user.vendorId) return true;
      
      // Check if task is in one of their hotels
      const hotelResult = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM hotels WHERE id = ? AND vendorId = ?`,
        [task.hotelId, user.vendorId]
      );
      return hotelResult[0][0].count > 0;
    }

    // Staff can access if assigned to them or in their hotel
    if (user.role === 'STAFF' && user.staffId) {
      return user.staffHotelId === task.hotelId || user.staffId === task.assignedToId;
    }

    return false;
  } catch (error) {
    console.error('Error checking task access:', error);
    return false;
  }
}

export async function GET(
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

    // Check task access permission
    const canAccess = await canAccessTask(session.user.id, taskId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Fetch the task with complete relations
    const [taskRows] = await pool.query<RowDataPacket[]>(
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
        st.position as assignedToPosition,
        r.name as roomName,
        ru.roomNumber as roomNumber,
        h.name as hotelName
       FROM facility_tasks ft
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       LEFT JOIN staff st ON s.id = st.id
       LEFT JOIN room_units ru ON ft.roomUnitId = ru.id
       LEFT JOIN rooms r ON ru.roomId = r.id
       LEFT JOIN hotels h ON ft.hotelId = h.id
       WHERE ft.taskId = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskRows[0];
    
    // Format response
    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      hotelId: task.hotelId,
      hotelName: task.hotelName,
      roomUnitId: task.roomUnitId,
      room: task.roomUnitId ? {
        id: task.roomUnitId,
        name: task.roomName ? `${task.roomName} - ${task.roomNumber}` : task.roomNumber,
        number: task.roomNumber,
      } : null,
      assignedToId: task.assignedToId,
      assignedTo: task.assignedToId ? {
        id: task.assignedToId,
        userId: task.assignedToUserId,
        position: task.assignedToPosition,
        user: {
          id: task.assignedToUserId,
          name: task.assignedToName,
          email: task.assignedToEmail,
        },
      } : null,
      createdById: task.createdById,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      costEstimate: task.costEstimate,
      maintenanceType: task.maintenanceType,
      isRecurring: task.isRecurring,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


export async function PUT(
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

    // Check task access permission
    const canAccess = await canAccessTask(session.user.id, taskId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Get the existing task
    const [existingTaskRows] = await pool.query<RowDataPacket[]>(
      `SELECT taskId as id, staffId as assignedToId, status FROM facility_tasks WHERE taskId = ?`,
      [taskId]
    );

    if (existingTaskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const existingTask = existingTaskRows[0];

    // Parse and validate the update data
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (validatedData.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(validatedData.title);
    }
    if (validatedData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(validatedData.description);
    }
    if (validatedData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(validatedData.status);
    }
    if (validatedData.priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(validatedData.priority);
    }
    if (validatedData.category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(validatedData.category);
    }
    if (validatedData.dueDate !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(validatedData.dueDate);
    }
    if (validatedData.assignedToId !== undefined) {
      updateFields.push('staffId = ?');
      updateValues.push(validatedData.assignedToId);
    }
    if (validatedData.estimatedHours !== undefined) {
      updateFields.push('estimated_hours = ?');
      updateValues.push(validatedData.estimatedHours);
    }
    if (validatedData.costEstimate !== undefined) {
      updateFields.push('cost_estimate = ?');
      updateValues.push(validatedData.costEstimate);
    }
    if (validatedData.roomId !== undefined) {
      if (validatedData.roomId === null) {
        updateFields.push('roomUnitId = NULL');
      } else {
        // Map roomId to roomUnitId if provided
        const [roomUnitRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM room_units WHERE id = ? LIMIT 1`,
          [validatedData.roomId]
        );
        if (roomUnitRows.length > 0) {
          updateFields.push('roomUnitId = ?');
          updateValues.push(roomUnitRows[0].id);
        }
      }
    }
    if (validatedData.maintenanceType !== undefined) {
      updateFields.push('maintenance_type = ?');
      updateValues.push(validatedData.maintenanceType);
    }
    if (validatedData.isRecurring !== undefined) {
      updateFields.push('is_recurring = ?');
      updateValues.push(validatedData.isRecurring ? 1 : 0);
    }
    if (validatedData.attachments !== undefined) {
      updateFields.push('attachments = ?');
      updateValues.push(validatedData.attachments);
    }

    // Always update updatedAt
    updateFields.push('updated_at = NOW()');

    // Execute update
    const updateQuery = `UPDATE facility_tasks SET ${updateFields.join(', ')} WHERE taskId = ?`;
    updateValues.push(taskId);

    await pool.query(updateQuery, updateValues);

    // Track changes for notifications
    const assignmentChanged = validatedData.assignedToId !== undefined && 
                              validatedData.assignedToId !== existingTask.assignedToId;
    const statusChanged = validatedData.status !== undefined && 
                          validatedData.status !== existingTask.status;

    // Fetch updated task
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
        st.position as assignedToPosition,
        r.name as roomName,
        ru.roomNumber as roomNumber,
        h.name as hotelName
       FROM facility_tasks ft
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       LEFT JOIN staff st ON s.id = st.id
       LEFT JOIN room_units ru ON ft.roomUnitId = ru.id
       LEFT JOIN rooms r ON ru.roomId = r.id
       LEFT JOIN hotels h ON ft.hotelId = h.id
       WHERE ft.taskId = ?`,
      [taskId]
    );

    if (updatedTaskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found after update' }, { status: 404 });
    }

    const updatedTask = updatedTaskRows[0];

    // Send notifications if assignment changed
    if (assignmentChanged && updatedTask.assignedToId) {
      try {
        await pool.query(
          `INSERT INTO notifications 
           (title, content, type, status, recipient, recipientId, senderId, metadata, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            'Task Assigned',
            `You have been assigned to task: ${updatedTask.title}`,
            'SYSTEM',
            'UNREAD',
            'STAFF',
            updatedTask.assignedToUserId,
            session.user.id,
            JSON.stringify({ taskId: updatedTask.id }),
          ]
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    // Send notifications if status changed
    if (statusChanged) {
      try {
        const [createdByRows] = await pool.query<RowDataPacket[]>(
          `SELECT vendorId as createdById FROM facility_tasks WHERE taskId = ?`,
          [taskId]
        );

        if (createdByRows.length > 0 && createdByRows[0].createdById !== session.user.id) {
          // Get the vendor's user ID
          const [vendorUserRows] = await pool.query<RowDataPacket[]>(
            `SELECT userId FROM vendors WHERE id = ?`,
            [createdByRows[0].createdById]
          );
          
          if (vendorUserRows.length > 0) {
            await pool.query(
              `INSERT INTO notifications 
               (title, content, type, status, recipient, recipientId, senderId, metadata, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                'Task Status Updated',
                `Task "${updatedTask.title}" status changed to ${validatedData.status}`,
                'SYSTEM',
                'UNREAD',
                'USER',
                vendorUserRows[0].userId,
                session.user.id,
                JSON.stringify({ taskId: updatedTask.id }),
              ]
            );
          }
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    // Format response
    return NextResponse.json({
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      category: updatedTask.category,
      hotelId: updatedTask.hotelId,
      hotelName: updatedTask.hotelName,
      roomUnitId: updatedTask.roomUnitId,
      room: updatedTask.roomUnitId ? {
        id: updatedTask.roomUnitId,
        name: updatedTask.roomName ? `${updatedTask.roomName} - ${updatedTask.roomNumber}` : updatedTask.roomNumber,
        number: updatedTask.roomNumber,
      } : null,
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
    });
  } catch (error) {
    console.error('Error updating task:', error);
    
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

export async function DELETE(
  _request: Request,
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

    // Check task access permission
    const canAccess = await canAccessTask(session.user.id, taskId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Get the task first
    const [taskRows] = await pool.query<RowDataPacket[]>(
      `SELECT taskId as id FROM facility_tasks WHERE taskId = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete the task itself
    await pool.query(`DELETE FROM facility_tasks WHERE taskId = ?`, [taskId]);

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
