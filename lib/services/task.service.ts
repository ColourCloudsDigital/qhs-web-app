import pool from '@/lib/db';
import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums'
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
  try {
    // Get the main task
    const [taskRows] = await pool.query(
      'SELECT * FROM facility_tasks WHERE id = ?',
      [taskId]
    );

    const task = (taskRows as any[])[0];
    if (!task) return null;

    // Get assigned staff with user info
    let assignedTo = null;
    if (task.assignedToId) {
      const [staffRows] = await pool.query(
        `SELECT s.*, u.id as userId, u.name as userName, u.email as userEmail 
         FROM staff s 
         JOIN users u ON s.userId = u.id 
         WHERE s.id = ?`,
        [task.assignedToId]
      );
      
      const staff = (staffRows as any[])[0];
      if (staff) {
        assignedTo = {
          ...staff,
          user: {
            id: staff.userId,
            name: staff.userName,
            email: staff.userEmail
          }
        };
      }
    }

    // Get creator info
    let createdBy = null;
    if (task.createdById) {
      const [userRows] = await pool.query(
        'SELECT id, name, email FROM users WHERE id = ?',
        [task.createdById]
      );
      createdBy = (userRows as any[])[0] || null;
    }

    // Get last updated by info
    let lastUpdatedBy = null;
    if (task.lastUpdatedById) {
      const [userRows] = await pool.query(
        'SELECT id, name, email FROM users WHERE id = ?',
        [task.lastUpdatedById]
      );
      lastUpdatedBy = (userRows as any[])[0] || null;
    }

    // Get room info
    let room = null;
    if (task.roomId) {
      const [roomRows] = await pool.query(
        'SELECT id, name FROM rooms WHERE id = ?',
        [task.roomId]
      );
      room = (roomRows as any[])[0] || null;
    }

    // Get hotel info
    let hotel = null;
    if (task.hotelId) {
      const [hotelRows] = await pool.query(
        'SELECT id, name FROM hotels WHERE id = ?',
        [task.hotelId]
      );
      hotel = (hotelRows as any[])[0] || null;
    }

    // Get checklist items
    const [checklistRows] = await pool.query(
      'SELECT * FROM task_checklist_items WHERE taskId = ? ORDER BY `order` ASC',
      [taskId]
    );

    // Get comments with user info
    const [commentRows] = await pool.query(
      `SELECT tc.*, u.id as userId, u.name as userName 
       FROM task_comments tc 
       JOIN users u ON tc.userId = u.id 
       WHERE tc.taskId = ? 
       ORDER BY tc.createdAt DESC`,
      [taskId]
    );

    const comments = (commentRows as any[]).map(comment => ({
      ...comment,
      user: {
        id: comment.userId,
        name: comment.userName
      }
    }));

    // Get parts
    const [partsRows] = await pool.query(
      'SELECT * FROM task_parts WHERE taskId = ?',
      [taskId]
    );

    // Get parent task
    let parentTask = null;
    if (task.parentTaskId) {
      const [parentRows] = await pool.query(
        'SELECT * FROM facility_tasks WHERE id = ?',
        [task.parentTaskId]
      );
      parentTask = (parentRows as any[])[0] || null;
    }

    // Get child tasks
    const [childRows] = await pool.query(
      'SELECT id, title, status FROM facility_tasks WHERE parentTaskId = ?',
      [taskId]
    );

    return {
      ...task,
      assignedTo,
      createdBy,
      lastUpdatedBy,
      room,
      hotel,
      checklist: checklistRows,
      comments,
      parts: partsRows,
      parentTask,
      childTasks: childRows
    };
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    throw error;
  }
}

  /**
   * Add a comment to a task
   */
  static async addComment(data: TaskCommentInput) {
    const { taskId, userId, content, attachments } = data;

    try {
      // Create the comment
      const [result] = await pool.query(
        `INSERT INTO task_comments (id, taskId, userId, content, attachments, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())`,
        [taskId, userId, content, attachments ? JSON.stringify(attachments) : null]
      );

      const commentId = (result as any).insertId;

      // Get the created comment with user info
      const [commentRows] = await pool.query(
        `SELECT tc.*, u.id as userId, u.name as userName 
         FROM task_comments tc 
         JOIN users u ON tc.userId = u.id 
         WHERE tc.id = ?`,
        [commentId]
      );

      const comment = (commentRows as any[])[0];
      const formattedComment = {
        ...comment,
        user: {
          id: comment.userId,
          name: comment.userName
        }
      };

      // Update task to mark it as updated
      await pool.query(
        'UPDATE facility_tasks SET lastUpdatedById = ?, updatedAt = NOW() WHERE id = ?',
        [userId, taskId]
      );

      // Find task and its creator to notify about the comment
      const [taskRows] = await pool.query(
        'SELECT title, createdById, assignedToId FROM facility_tasks WHERE id = ?',
        [taskId]
      );

      const task = (taskRows as any[])[0];

      if (task) {
        // Only notify if the commenter is not the task creator
        if (task.createdById !== userId) {
          await pool.query(
            `INSERT INTO notifications (id, title, content, type, status, recipient, userId, senderId, metadata, createdAt, updatedAt) 
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              'New Comment on Task',
              `New comment on task "${task.title}"`,
              'SYSTEM',
              'UNREAD',
              'USER',
              task.createdById,
              userId,
              JSON.stringify({ taskId, commentId })
            ]
          );
        }

        // If there's an assignee and it's not the commenter, notify them too
        if (task.assignedToId) {
          const [staffRows] = await pool.query(
            'SELECT userId FROM staff WHERE id = ?',
            [task.assignedToId]
          );

          const assignee = (staffRows as any[])[0];

          if (assignee && assignee.userId !== userId) {
            await pool.query(
              `INSERT INTO notifications (id, title, content, type, status, recipient, userId, senderId, metadata, createdAt, updatedAt) 
               VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                'New Comment on Your Task',
                `New comment on task "${task.title}"`,
                'SYSTEM',
                'UNREAD',
                'USER',
                assignee.userId,
                userId,
                JSON.stringify({ taskId, commentId })
              ]
            );
          }
        }
      }

      return formattedComment;
    } catch (error) {
      console.error('Error adding task comment:', error);
      throw error;
    }
  }

  /**
   * Add checklist items to a task
   */
  static async addChecklistItems(items: TaskChecklistItemInput[]) {
    try {
      const results = [];
      
      for (const item of items) {
        const [result] = await pool.query(
          `INSERT INTO task_checklist_items (id, taskId, description, \`order\`, createdAt, updatedAt) 
           VALUES (UUID(), ?, ?, ?, NOW(), NOW())`,
          [item.taskId, item.description, item.order]
        );
        
        const itemId = (result as any).insertId;
        
        const [itemRows] = await pool.query(
          'SELECT * FROM task_checklist_items WHERE id = ?',
          [itemId]
        );
        
        results.push((itemRows as any[])[0]);
      }
      
      return results;
    } catch (error) {
      console.error('Error adding checklist items:', error);
      throw error;
    }
  }

  /**
   * Update a checklist item's completion status
   */
  static async updateChecklistItem(data: TaskChecklistUpdateInput) {
    const { id, isCompleted, completedBy } = data;
    
    try {
      await pool.query(
        `UPDATE task_checklist_items 
         SET isCompleted = ?, completedAt = ?, completedBy = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [isCompleted, isCompleted ? new Date() : null, completedBy, id]
      );

      const [rows] = await pool.query(
        'SELECT * FROM task_checklist_items WHERE id = ?',
        [id]
      );

      return (rows as any[])[0];
    } catch (error) {
      console.error('Error updating checklist item:', error);
      throw error;
    }
  }

  /**
   * Create a recurring task series
   */
  static async createRecurringTask(
    taskData: any, 
    pattern: RecurringPatternInput,
    userId: string
  ) {
    // This functionality requires database implementation
    throw new Error('Recurring tasks not yet implemented with MySQL');
  }

  /**
   * Get tasks due for maintenance in the next N days
   */
  static async getUpcomingTasks(hotelId: string, days: number = 7) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      const [rows] = await pool.query(
        `SELECT ft.*, 
                s.id as staffId, u.name as assignedUserName,
                r.name as roomName
         FROM facility_tasks ft
         LEFT JOIN staff s ON ft.assignedToId = s.id
         LEFT JOIN users u ON s.userId = u.id
         LEFT JOIN rooms r ON ft.roomId = r.id
         WHERE ft.hotelId = ? 
         AND ft.status IN ('PENDING', 'IN_PROGRESS') 
         AND ft.dueDate <= ?
         ORDER BY ft.dueDate ASC, ft.priority DESC`,
        [hotelId, endDate]
      );

      return (rows as any[]).map(task => ({
        ...task,
        assignedTo: task.staffId ? {
          id: task.staffId,
          user: {
            name: task.assignedUserName
          }
        } : null,
        room: task.roomName ? {
          name: task.roomName
        } : null
      }));
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw error;
    }
  }

  /**
   * Get tasks stats by status
   */
  static async getTaskStats(hotelId: string) {
    try {
      // Get status counts
      const [statusRows] = await pool.query(
        'SELECT status, COUNT(*) as count FROM facility_tasks WHERE hotelId = ? GROUP BY status',
        [hotelId]
      );

      // Get priority counts
      const [priorityRows] = await pool.query(
        'SELECT priority, COUNT(*) as count FROM facility_tasks WHERE hotelId = ? GROUP BY priority',
        [hotelId]
      );

      // Get category counts
      const [categoryRows] = await pool.query(
        'SELECT category, COUNT(*) as count FROM facility_tasks WHERE hotelId = ? GROUP BY category',
        [hotelId]
      );

      // Get total tasks
      const [totalRows] = await pool.query(
        'SELECT COUNT(*) as total FROM facility_tasks WHERE hotelId = ?',
        [hotelId]
      );

      // Get overdue tasks
      const [overdueRows] = await pool.query(
        `SELECT COUNT(*) as overdue FROM facility_tasks 
         WHERE hotelId = ? 
         AND dueDate < NOW() 
         AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [hotelId]
      );

      const totalTasks = (totalRows as any[])[0].total;
      const overdueTasks = (overdueRows as any[])[0].overdue;

      const statusCounts = (statusRows as any[]).map(row => ({
        status: row.status,
        _count: row.count
      }));

      const priorityCounts = (priorityRows as any[]).map(row => ({
        priority: row.priority,
        _count: row.count
      }));

      const categoryCounts = (categoryRows as any[]).map(row => ({
        category: row.category,
        _count: row.count
      }));

      return {
        totalTasks,
        overdueTasks,
        statusCounts,
        priorityCounts,
        categoryCounts
      };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      throw error;
    }
  }
}

export default TaskService;