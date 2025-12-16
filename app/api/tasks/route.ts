import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { TaskStatus, TaskPriority, TaskCategory, MaintenanceType } from '@/lib/types/enums';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

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
    const session = await auth();
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
    const category = searchParams.get('category');
    const assignedToId = searchParams.get('assignedToId');
    const roomId = searchParams.get('roomId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter based on role and query params
    let filter: any = {};
    
    // Role-based filters
    const userRole = session.user.role;
    
    if (userRole === 'VENDOR') {
      // Vendor can see tasks for their hotels
      const vendor = await prisma.vendor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }
      
      const vendorHotels = await prisma.hotel.findMany({
        where: { vendorId: vendor.id },
        select: { id: true },
      });
      
      filter.hotelId = { in: vendorHotels.map(hotel => hotel.id) };
      
      // If specific hotel is requested, verify it belongs to vendor
      if (hotelId) {
        const hasHotel = vendorHotels.some(hotel => hotel.id === hotelId);
        if (!hasHotel) {
          return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
        }
        filter.hotelId = hotelId;
      }
    } else if (userRole === 'STAFF') {
      // Staff can see tasks assigned to them or all tasks in their hotel
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
        select: { id: true, hotelId: true },
      });
      
      if (!staff) {
        return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
      }
      
      // If hotel ID is provided, make sure staff has access to it
      if (hotelId && hotelId !== staff.hotelId) {
        return NextResponse.json({ error: 'Access denied to this hotel' }, { status: 403 });
      }
      
      filter.hotelId = staff.hotelId;
      
      // By default, staff sees tasks assigned to them
      // If assignedToId is explicitly provided, check permission to view all tasks
      if (!assignedToId) {
        filter.assignedToId = staff.id;
      }
    }
    
    // Apply query filters
    if (assignedToId) filter.assignedToId = assignedToId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (roomId) filter.roomId = roomId;

    // Get tasks with pagination
    const [tasks, totalCount] = await Promise.all([
      prisma.facilityTask.findMany({
        where: filter,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
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
          checklist: {
            orderBy: { order: 'asc' },
          },
        },
        skip,
        take: limit,
      }),
      prisma.facilityTask.count({ where: filter }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tasks,
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