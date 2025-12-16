import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType, TaskStatus } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

// Schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  completedAt: z.string().transform(str => new Date(str)).nullable().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().nullable().optional(),
  costEstimate: z.number().nonnegative().optional(),
  actualCost: z.number().nonnegative().nullable().optional(),
  roomId: z.string().uuid().nullable().optional(),
  maintenanceType: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().nullable().optional(),
  attachments: z.string().optional(), // JSON string of URLs
});

// Helper to check task access permission
async function canAccessTask(userId: string, taskId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendor: {
        include: { hotels: { select: { id: true } } }
      },
      staff: true,
    }
  });

  if (!user) return false;

  const task = await prisma.facilityTask.findUnique({
    where: { id: taskId },
    select: { hotelId: true, assignedToId: true, createdById: true }
  });

  if (!task) return false;

  // Creator always has access
  if (task.createdById === userId) return true;

  // Check based on role
  if (user.role === 'SUPER_ADMIN') return true;
  
  if (user.role === 'VENDOR' && user.vendor) {
    // Vendor can access if task is in one of their hotels
    return user.vendor.hotels.some(hotel => hotel.id === task.hotelId);
  }
  
  if (user.role === 'STAFF' && user.staff) {
    // Staff can access if assigned to them or in their hotel
    return (
      user.staff.hotelId === task.hotelId || 
      user.staff.id === task.assignedToId
    );
  }

  return false;
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
    const task = await TaskService.getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Make sure required fields are included even if null
    const maintenanceType = task.maintenanceType || 'CORRECTIVE';
    const comments = task.comments || [];
    const checklist = task.checklist || [];

    return NextResponse.json({
      ...task,
      maintenanceType,
      comments,
      checklist
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
    const session = await auth();
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
    const existingTask = await prisma.facilityTask.findUnique({
      where: { id: taskId },
      select: { assignedToId: true, status: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Parse and validate the update data
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Track if assignment has changed for notification
    const assignmentChanged = validatedData.assignedToId !== undefined && 
                              validatedData.assignedToId !== existingTask.assignedToId;
    
    // Track if status has changed for notification
    const statusChanged = validatedData.status !== undefined && 
                           validatedData.status !== existingTask.status;

    // Check if task is marked as completed
    const markedAsCompleted = 
      validatedData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED';

    // If task is completed, set completedAt to now if not provided
    if (markedAsCompleted && !validatedData.completedAt) {
      validatedData.completedAt = new Date();
    }

    // Update the task
    const updatedTask = await prisma.facilityTask.update({
      where: { id: taskId },
      data: {
        ...validatedData,
        lastUpdatedById: session.user.id,
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        room: true,
        hotel: {
          select: { id: true, name: true }
        },
        checklist: true,
      }
    });

    // Send notifications if assignment or status changed
    if (assignmentChanged && updatedTask.assignedToId) {
      // Get staff user info for notification
      const staffUser = await prisma.staff.findUnique({
        where: { id: updatedTask.assignedToId },
        include: { user: true }
      });

      if (staffUser) {
        await prisma.notification.create({
          data: {
            title: 'Task Assigned',
            content: `You have been assigned to task: ${updatedTask.title}`,
            type: 'SYSTEM',
            status: 'UNREAD',
            recipient: 'STAFF',
            recipientId: staffUser.userId,
            senderId: session.user.id,
            metadata: JSON.stringify({ taskId: updatedTask.id }),
          },
        });
      }
    }

    if (statusChanged) {
      // Notify task creator
      if (updatedTask.createdById !== session.user.id) {
        await prisma.notification.create({
          data: {
            title: 'Task Status Updated',
            content: `Task "${updatedTask.title}" status changed to ${updatedTask.status}`,
            type: 'SYSTEM',
            status: 'UNREAD',
            recipient: 'USER',
            recipientId: updatedTask.createdById,
            senderId: session.user.id,
            metadata: JSON.stringify({ taskId: updatedTask.id }),
          },
        });
      }
    }

    return NextResponse.json(updatedTask);
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