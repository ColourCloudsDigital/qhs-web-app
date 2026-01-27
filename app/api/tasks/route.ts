import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { TaskStatus, TaskPriority, TaskCategory, MaintenanceType } from '@/lib/types/enums';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';
import NotificationService from '@/lib/services/notification.service';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  assignedToId: z.string().optional().nullable(),
  hotelId: z.string(),
  roomUnitId: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  category: z.nativeEnum(TaskCategory),
  dueDate: z.string().transform(str => {
    const date = new Date(str);
    // Format as YYYY-MM-DD for MySQL date type
    return date.toISOString().split('T')[0];
  }),
  estimatedHours: z.number().positive().optional(),
  costEstimate: z.number().nonnegative().optional(),
  maintenanceType: z.nativeEnum(MaintenanceType).default(MaintenanceType.CORRECTIVE),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  attachments: z.string().optional(), // JSON string of URLs
  checklist: z.array(z.object({
    description: z.string(),
    order: z.number().int().nonnegative()
  })).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to Facility Management module
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

    // Get the JSON body and validate
    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    // Remove checklist from validated data since we'll handle it separately
    const { checklist, ...taskData } = validatedData;

    // Get vendor ID from user
    const [vendorResult] = await pool.query(
      'SELECT id FROM vendors WHERE userId = ?',
      [session.user.id]
    ) as [RowDataPacket[], any];

    const vendorId = vendorResult?.[0]?.id;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor information not found' },
        { status: 403 }
      );
    }

    // Use the roomUnitId directly from the request
    const roomUnitId = taskData.roomUnitId || null;

    // Generate task ID
    const taskId = require('crypto').randomUUID();

    // Create the task in MySQL - matching the exact schema
    const insertQuery = `
      INSERT INTO facility_tasks (
        taskId, hotelId, title, description, category, priority, 
        due_date, staffId, vendorId, roomUnitId, maintenance_type, 
        estimated_hours, cost_estimate, is_recurring, status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await pool.query(insertQuery, [
      taskId,
      taskData.hotelId,
      taskData.title,
      taskData.description,
      taskData.category,
      taskData.priority,
      taskData.dueDate,
      taskData.assignedToId || null,
      vendorId,
      roomUnitId,
      taskData.maintenanceType,
      taskData.estimatedHours || null,
      taskData.costEstimate || null,
      taskData.isRecurring ? 1 : 0,
      taskData.status,
    ]);

    // Create checklist items if provided
    if (checklist && checklist.length > 0) {
      const checklistInsertQuery = `
        INSERT INTO task_checklist (id, taskId, description, \`order\`, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      for (const item of checklist) {
        const checklistId = require('crypto').randomUUID();
        await pool.query(checklistInsertQuery, [
          checklistId,
          taskId,
          item.description,
          item.order,
        ]);
      }
    }

    // If task is assigned to someone, create a notification using NotificationService
    if (taskData.assignedToId) {
      try {
        // Get assigned staff user ID
        const [staffResult] = await pool.query(
          'SELECT userId FROM staff WHERE id = ?',
          [taskData.assignedToId]
        ) as [RowDataPacket[], any];
        
        const assignedUserId = staffResult?.[0]?.userId;
        
        if (assignedUserId) {
          await NotificationService.notifyTaskCreated(
            assignedUserId,
            taskId,
            taskData.title,
            taskData.priority,
            session.user.id
          );
        }
      } catch (notificationError) {
        console.error('Error creating task assignment notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }
    
    // Notify hotel staff about new task
    try {
      const staffUsers = await NotificationService.getHotelStaff(taskData.hotelId);
      if (staffUsers.length > 0) {
        await NotificationService.createBulkNotifications(
          staffUsers.filter(id => id !== session.user.id && id !== taskData.assignedToId),
          {
            title: 'New Task Created',
            content: `New ${taskData.priority.toLowerCase()} priority task: ${taskData.title}`,
            type: 'MAINTENANCE' as any,
            senderId: session.user.id,
            metadata: {
              taskId,
              hotelId: taskData.hotelId,
              action: 'created',
              entityType: 'task'
            }
          }
        );
      }
    } catch (notificationError) {
      console.error('Error creating task creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Fetch the created task with related data
    const [task] = await pool.query(
      `SELECT ft.taskId as id, ft.hotelId, ft.title, ft.description, ft.category, 
              ft.priority, ft.due_date as dueDate, ft.staffId, ft.vendorId, ft.roomUnitId, 
              ft.maintenance_type as maintenanceType, ft.estimated_hours as estimatedHours, ft.cost_estimate as costEstimate, 
              ft.is_recurring as isRecurring, ft.status, ft.created_at as createdAt, ft.updated_at as updatedAt,
              u.name as staffName, u.email as staffEmail
       FROM facility_tasks ft
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       WHERE ft.taskId = ?`,
      [taskId]
    ) as [RowDataPacket[], any];

    return NextResponse.json(task[0] || { id: taskId, ...taskData, vendorId }, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    
    // Return a more specific error if it's a validation error
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to Facility Management module
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

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Build query
    let whereClause = 'WHERE ft.hotelId = ?';
    const params: any[] = [hotelId];

    if (status) {
      whereClause += ' AND ft.status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND ft.priority = ?';
      params.push(priority);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM facility_tasks ft ${whereClause}`,
      params
    ) as [RowDataPacket[], any];

    const totalCount = countResult[0]?.total || 0;

    // Get tasks with pagination
    const [tasks] = await pool.query(
      `SELECT ft.taskId as id, ft.hotelId, ft.title, ft.description, ft.category, 
              ft.priority, ft.due_date as dueDate, ft.staffId, ft.vendorId, ft.roomUnitId, 
              ft.maintenance_type as maintenanceType, ft.estimated_hours as estimatedHours, ft.cost_estimate as costEstimate, 
              ft.is_recurring as isRecurring, ft.status, ft.created_at as createdAt, ft.updated_at as updatedAt,
              s.id as assignedToId, u.id as assignedToUserId, u.name as assignedToName, u.email as assignedToEmail,
              r.name as roomName, ru.roomNumber
       FROM facility_tasks ft
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       LEFT JOIN room_units ru ON ft.roomUnitId = ru.id
       LEFT JOIN rooms r ON ru.roomId = r.id
       ${whereClause}
       ORDER BY ft.priority DESC, ft.due_date ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as [RowDataPacket[], any];

    // Format the tasks with proper nested objects
    const formattedTasks = (tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      hotelId: task.hotelId,
      maintenanceType: task.maintenanceType,
      estimatedHours: task.estimatedHours,
      costEstimate: task.costEstimate,
      isRecurring: task.isRecurring,
      assignedTo: task.assignedToId ? {
        id: task.assignedToId,
        user: {
          id: task.assignedToUserId,
          name: task.assignedToName,
          email: task.assignedToEmail,
        }
      } : null,
      room: task.roomUnitId ? {
        id: task.roomUnitId,
        name: task.roomName ? `${task.roomName} - ${task.roomNumber}` : task.roomNumber,
      } : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tasks: formattedTasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}