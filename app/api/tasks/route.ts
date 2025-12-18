import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { TaskStatus, TaskPriority, TaskCategory, MaintenanceType } from '@/lib/types/enums';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  assignedToId: z.string().optional().nullable(),
  hotelId: z.string().uuid('Invalid hotel ID'),
  roomId: z.string().uuid('Invalid room ID').optional().nullable(),
  status: z.nativeEnum(TaskStatus).default('PENDING'),
  priority: z.nativeEnum(TaskPriority).default('MEDIUM'),
  category: z.nativeEnum(TaskCategory),
  dueDate: z.string().transform(str => new Date(str)),
  estimatedHours: z.number().positive().optional(),
  costEstimate: z.number().nonnegative().optional(),
  maintenanceType: z.nativeEnum(MaintenanceType).default('CORRECTIVE'),
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

    // Create checklist items if provided
    const checklistItems = validatedData.checklist 
      ? {
          create: validatedData.checklist.map((item: { description: string, order: number }) => ({
            description: item.description,
            order: item.order,
          }))
        }
      : undefined;
    
    // Remove checklist from validated data since we'll handle it separately
    const { checklist, ...taskData } = validatedData;

    // Create the task
    const task = await prisma.facilityTask.create({
      data: {
        ...taskData,
        createdById: session.user.id,
        checklist: checklistItems,
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        room: true,
        checklist: true,
      },
    });

    // If task is assigned to someone, create a notification
    if (task.assignedToId) {
      await prisma.notification.create({
        data: {
          title: `New Task Created: ${task.title}`,
          content: `You have been assigned a new task: ${task.title}`,
          type: 'TASK',
          recipient: 'USER',
          userId: task.assignedToId,
          senderId: session.user.id,
          metadata: JSON.stringify({ taskId: task.id })
        },
      });
    }

    return NextResponse.json(task, { status: 201 });
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
      `SELECT ft.taskId, ft.hotelId, ft.title, ft.description, ft.category, 
              ft.priority, ft.due_date, ft.staffId, ft.vendorId, ft.roomUnitId, 
              ft.maintenance_type, ft.estimated_hours, ft.cost_estimate, 
              ft.is_recurring, ft.status, ft.created_at, ft.updated_at,
              u.name as staffName, u.email as staffEmail
       FROM facility_tasks ft
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       ${whereClause}
       ORDER BY ft.priority DESC, ft.due_date ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as [RowDataPacket[], any];

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tasks: tasks || [],
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