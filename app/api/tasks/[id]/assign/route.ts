import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

const assignSchema = z.object({
  assignedToId: z.string().uuid('Invalid staff ID')
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

    // Check if staff exists and belongs to the same hotel as the task
    const task = await prisma.facilityTask.findUnique({
      where: { id: taskId },
      select: { hotelId: true, assignedToId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: assignedToId },
      select: { hotelId: true, userId: true }
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

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
    const updatedTask = await prisma.facilityTask.update({
      where: { id: taskId },
      data: {
        assignedToId,
        lastUpdatedById: session.user.id
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Create a notification for the staff member
    await prisma.notification.create({
      data: {
        title: `Task Assigned: ${updatedTask.title}`,
        content: `You have been assigned a new task: ${updatedTask.title}`,
        type: 'TASK',
        recipient: 'USER',
        userId: staff.userId,
        senderId: session.user.id,
        metadata: JSON.stringify({ taskId: updatedTask.id })
      }
    });

    // Create a task comment about the assignment
    await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.user.id,
        content: `Task assigned to ${updatedTask.assignedTo?.user.name || 'a staff member'}.`
      }
    });

    return NextResponse.json({
      message: 'Task assigned successfully',
      task: updatedTask
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