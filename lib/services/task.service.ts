import pool from '@/lib/db';
import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums'
import { Prisma } from '@prisma/client';
import { calculateNextOccurrence } from '@/lib/utils';

interface TaskCommentInput {
  taskId: string;
  userId: string;
  content: string;
  attachments?: string[];
}

interface TaskChecklistItemInput {
  taskId: string;
  description: string;
  order: number;
}

interface TaskChecklistUpdateInput {
  id: string;
  isCompleted: boolean;
  completedBy?: string;
}

interface RecurringPatternInput {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  endAfterOccurrences?: number;
  daysOfWeek?: number[]; // For weekly: 0=Sunday, 6=Saturday
  dayOfMonth?: number; // For monthly
  monthOfYear?: number; // For yearly
}

export class TaskService {
 
/**
 * Get task with all related entities
 */
static async getTaskById(taskId: string) {
  return prisma.facilityTask.findUnique({
    where: { id: taskId },
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
      lastUpdatedBy: {
        select: { id: true, name: true, email: true }
      },
      room: {
        select: { id: true, name: true }
      },
      hotel: {
        select: { id: true, name: true }
      },
      checklist: {
        orderBy: { order: 'asc' }
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      parts: true,
      parentTask: true,
      childTasks: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });
}

  /**
   * Add a comment to a task
   */
  static async addComment(data: TaskCommentInput) {
    const { taskId, userId, content, attachments } = data;

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content,
        attachments: attachments ? JSON.stringify(attachments) : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // Update task to mark it as updated
    await prisma.facilityTask.update({
      where: { id: taskId },
      data: {
        lastUpdatedById: userId,
      }
    });

    // Find task and its creator to notify about the comment
    const task = await prisma.facilityTask.findUnique({
      where: { id: taskId },
      select: { 
        title: true, 
        createdById: true,
        assignedToId: true,
      }
    });

    if (task) {
      // Only notify if the commenter is not the task creator
      if (task.createdById !== userId) {
        await prisma.notification.create({
          data: {
            title: 'New Comment on Task',
            content: `New comment on task "${task.title}"`,
            type: 'SYSTEM',
            status: 'UNREAD',
            recipient: 'USER',
            userId: task.createdById,
            senderId: userId,
            metadata: JSON.stringify({ taskId, commentId: comment.id }),
          }
        });
      }

      // If there's an assignee and it's not the commenter, notify them too
      if (task.assignedToId) {
        const assignee = await prisma.staff.findUnique({
          where: { id: task.assignedToId },
          select: { userId: true }
        });

        if (assignee && assignee.userId !== userId) {
          await prisma.notification.create({
            data: {
              title: 'New Comment on Your Task',
              content: `New comment on task "${task.title}"`,
              type: 'SYSTEM',
              status: 'UNREAD',
              recipient: 'USER',
              userId: assignee.userId,
              senderId: userId,
              metadata: JSON.stringify({ taskId, commentId: comment.id }),
            }
          });
        }
      }
    }

    return comment;
  }

  /**
   * Add checklist items to a task
   */
  static async addChecklistItems(items: TaskChecklistItemInput[]) {
    return prisma.$transaction(
      items.map(item => 
        prisma.taskChecklistItem.create({
          data: {
            taskId: item.taskId,
            description: item.description,
            order: item.order
          }
        })
      )
    );
  }

  /**
   * Update a checklist item's completion status
   */
  static async updateChecklistItem(data: TaskChecklistUpdateInput) {
    const { id, isCompleted, completedBy } = data;
    
    return prisma.taskChecklistItem.update({
      where: { id },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy
      }
    });
  }

  /**
   * Create a recurring task series
   */
  static async createRecurringTask(
    taskData: Prisma.FacilityTaskCreateInput, 
    pattern: RecurringPatternInput,
    userId: string
  ) {
    // Create the parent/template task
    const parentTask = await prisma.facilityTask.create({
      data: {
        ...taskData,
        isRecurring: true,
        recurringPattern: JSON.stringify(pattern),
        createdById: userId
      }
    });

    // Generate the first occurrence
    const baseDate = new Date(taskData.dueDate as Date);
    let occurrences = 1;
    const endDate = pattern.endDate ? new Date(pattern.endDate) : null;
    const maxOccurrences = pattern.endAfterOccurrences || 10; // Default to 10 if not specified

    // Schedule the first few occurrences
    const childTasks = [];
    let currentDate = baseDate;

    while (occurrences < maxOccurrences) {
      // Calculate the next occurrence date
      currentDate = calculateNextOccurrence(currentDate, pattern);
      
      // Stop if we've reached the end date
      if (endDate && currentDate > endDate) break;
      
      // Create the child task
      const childTask = await prisma.facilityTask.create({
        data: {
          ...taskData,
          dueDate: currentDate,
          parentTaskId: parentTask.id,
          isRecurring: false,
          createdById: userId
        }
      });
      
      childTasks.push(childTask);
      occurrences++;
    }

    return {
      parentTask,
      childTasks
    };
  }

  /**
   * Get tasks due for maintenance in the next N days
   */
  static async getUpcomingTasks(hotelId: string, days: number = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return prisma.facilityTask.findMany({
      where: {
        hotelId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: {
          lte: endDate
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ],
      include: {
        assignedTo: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        room: {
          select: { name: true }
        }
      }
    });
  }

  /**
   * Get tasks stats by status
   */
  static async getTaskStats(hotelId: string) {
    const statusCounts = await prisma.facilityTask.groupBy({
      by: ['status'],
      where: { hotelId },
      _count: true
    });

    const priorityCounts = await prisma.facilityTask.groupBy({
      by: ['priority'],
      where: { hotelId },
      _count: true
    });

    const categoryCounts = await prisma.facilityTask.groupBy({
      by: ['category'],
      where: { hotelId },
      _count: true
    });

    const totalTasks = await prisma.facilityTask.count({
      where: { hotelId }
    });

    const overdueTasks = await prisma.facilityTask.count({
      where: {
        hotelId,
        dueDate: { lt: new Date() },
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      }
    });

    return {
      totalTasks,
      overdueTasks,
      statusCounts,
      priorityCounts,
      categoryCounts
    };
  }
}

export default TaskService;