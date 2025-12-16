// /lib/services/notification.service.ts
import { NotificationStatus, NotificationType, NotificationRecipient } from '@/lib/types/enums'
import pool from '@/lib/db';
import { emailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationPreferencesInput {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  subscribedTypes?: NotificationType[];
  unsubscribedTypes?: NotificationType[];
}

export interface CreateNotificationInput {
  title: string;
  content: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  userId: string;
  senderId?: string;
  metadata?: any;
}

export interface SendBulkNotificationInput {
  id?: string;
  title: string;
  content: string;
  type: NotificationType;
  recipientType: NotificationRecipient;
  senderId?: string;
  metadata?: any;
  filter?: Record<string, any>;
}

export interface NotificationServiceInterface {
  createNotification(data: CreateNotificationInput): Promise<any>;
  sendBulkNotification(data: SendBulkNotificationInput): Promise<any>;
  getUserNotifications(userId: string, options?: any): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<any>;
  markAllAsRead(userId: string): Promise<any>;
  archiveNotification(notificationId: string, userId: string): Promise<any>;
  deleteNotification(notificationId: string, userId: string): Promise<any>;
  updateNotificationPreferences(userId: string, data: NotificationPreferencesInput): Promise<any>;
}

class NotificationService implements NotificationServiceInterface {
  async createNotification(data: CreateNotificationInput) {
    const { title, content, type, recipient, userId, senderId, metadata } = data;

    // Generate UUID for notification id (table expects id to be provided)
    const id = uuidv4();

    // Create the notification in the database (explicitly include `id`)
    await pool.query(
      `INSERT INTO notifications 
       (id, title, content, type, recipient, userId, senderId, metadata, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title,
        content,
        type,
        recipient,
        userId,
        senderId || null,
        metadata ? JSON.stringify(metadata) : null,
        NotificationStatus.UNREAD,
      ]
    );

    const insertId = id;
    
    // Get user preferences
    const [prefRows] = await pool.query(
      `SELECT * FROM notification_preferences WHERE userId = ?`,
      [userId]
    );
    
    const userPreference = (prefRows as any[])[0];
    
    // Default to all enabled if no preferences set
    const shouldSendEmail = userPreference ? userPreference.emailEnabled : true;
    const shouldSendPush = userPreference ? userPreference.pushEnabled : true;

    // Send email notification if enabled
    if (shouldSendEmail) {
      try {
        await this.sendEmailNotification({
          id: insertId,
          title,
          content,
          userId,
          type
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    // Send push notification if enabled
    if (shouldSendPush) {
      try {
        await this.sendPushNotification({
          id: insertId,
          title,
          content,
          userId,
          type
        });
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }

    // Fetch the created notification to return
    const [notificationRows] = await pool.query(
      `SELECT n.*, u.name as senderName, u.email as senderEmail
       FROM notifications n
       LEFT JOIN users u ON n.senderId = u.id
       WHERE n.id = ?`,
      [insertId]
    );
    
    const notification = (notificationRows as any[])[0];
    return notification;
  }

  async sendBulkNotification(data: SendBulkNotificationInput) {
    const { id = uuidv4(), title, content, type, recipientType, senderId, metadata } = data;
    
    // Find all users of the specified type
    let userIds: string[] = [];
    
    if (recipientType === NotificationRecipient.ALL) {
      const [rows] = await pool.query(
        `SELECT id FROM users WHERE isActive = 1`
      );
      userIds = (rows as any[]).map(user => user.id);
    } else if (recipientType === NotificationRecipient.VENDORS) {
      const [rows] = await pool.query(
        `SELECT userId FROM vendors`
      );
      userIds = (rows as any[]).map(vendor => vendor.userId);
    } else if (recipientType === NotificationRecipient.CUSTOMERS) {
      const [rows] = await pool.query(
        `SELECT userId FROM customers`
      );
      userIds = (rows as any[]).map(customer => customer.userId);
    } else if (recipientType === NotificationRecipient.STAFF) {
      const [rows] = await pool.query(
        `SELECT userId FROM staff`
      );
      userIds = (rows as any[]).map(s => s.userId);
    } else if (recipientType === NotificationRecipient.ADMINS) {
      const [rows] = await pool.query(
        `SELECT userId FROM super_admins`
      );
      userIds = (rows as any[]).map(admin => admin.userId);
    }

    // Create notifications for each user
    const notificationPromises = userIds.map(userId =>
      this.createNotification({
        title,
        content,
        type,
        recipient: NotificationRecipient.ALL, // Use ALL since we're sending to individuals
        userId,
        senderId,
        metadata,
      })
    );

    await Promise.all(notificationPromises);

    return { success: true, count: userIds.length };
  }

  async getUserNotifications(userId: string, options: any = {}) {
    const { status, type, limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    // Build filter conditions
    let whereClause = 'WHERE userId = ?';
    const queryParams = [userId];

    if (status) {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    if (type) {
      whereClause += ' AND type = ?';
      queryParams.push(type);
    }

    // Get total count for pagination
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      queryParams
    );
    
    const total = (countRows as any[])[0].total;

    // Add pagination parameters
    const paginationParams = [...queryParams, skip, parseInt(limit.toString())];
    
    // Get notifications
    const [rows] = await pool.query(
      `SELECT n.*, u.name as senderName, u.email as senderEmail
       FROM notifications n
       LEFT JOIN users u ON n.senderId = u.id
       ${whereClause}
       ORDER BY n.createdAt DESC
       LIMIT ?, ?`,
      paginationParams
    );

    // Parse metadata in each notification
    const notifications = (rows as any[]).map(notification => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }));

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Use pool query instead of Prisma
      try {
        const [rows] = await pool.query(
          `SELECT COUNT(*) as count FROM notifications 
           WHERE userId = ? AND status = ?`,
          [userId, NotificationStatus.UNREAD]
        );
        
        const count = (rows as any[])[0]?.count || 0;
        return count;
      } catch (e: any) {
        // Handle table not found error gracefully
        console.error('[NOTIFICATION SERVICE] SQL query error:', e);
        if (e.message && e.message.includes("doesn't exist")) {
          return 0;
        }
        throw e; // Re-throw other errors
      }
    } catch (error) {
      console.error('[NOTIFICATION SERVICE] Error getting unread count:', error);
      return 0; // Return 0 on error rather than crashing
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    // First verify the notification belongs to this user
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE id = ? AND userId = ?`,
      [notificationId, userId]
    );
    
    if ((rows as any[]).length === 0) {
      throw new Error('Notification not found or you do not have permission');
    }
    
    // Update status to READ
    await pool.query(
      `UPDATE notifications SET status = ?, updatedAt = NOW() WHERE id = ?`,
      [NotificationStatus.READ, notificationId]
    );
    
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    // Update all UNREAD notifications to READ
    await pool.query(
      `UPDATE notifications 
       SET status = ?, updatedAt = NOW() 
       WHERE userId = ? AND status = ?`,
      [NotificationStatus.READ, userId, NotificationStatus.UNREAD]
    );
    
    return { success: true };
  }

  async archiveNotification(notificationId: string, userId: string) {
    // First verify the notification belongs to this user
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE id = ? AND userId = ?`,
      [notificationId, userId]
    );
    
    if ((rows as any[]).length === 0) {
      throw new Error('Notification not found or you do not have permission');
    }
    
    // Update status to ARCHIVED
    await pool.query(
      `UPDATE notifications SET status = ?, updatedAt = NOW() WHERE id = ?`,
      [NotificationStatus.ARCHIVED, notificationId]
    );
    
    return { success: true };
  }

  async deleteNotification(notificationId: string, userId: string) {
    // First verify the notification belongs to this user
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE id = ? AND userId = ?`,
      [notificationId, userId]
    );
    
    if ((rows as any[]).length === 0) {
      throw new Error('Notification not found or you do not have permission');
    }
    
    // Delete the notification
    await pool.query(
      `DELETE FROM notifications WHERE id = ?`,
      [notificationId]
    );
    
    return { success: true };
  }

  async updateNotificationPreferences(userId: string, data: NotificationPreferencesInput) {
    const { emailEnabled, pushEnabled, inAppEnabled, subscribedTypes, unsubscribedTypes } = data;
    
    // Check if preferences already exist
    const [rows] = await pool.query(
      `SELECT * FROM notification_preferences WHERE userId = ?`,
      [userId]
    );
    
    const preferenceExists = (rows as any[]).length > 0;
    
    if (preferenceExists) {
      // Update existing preferences
      const updates = [];
      const params = [];
      
      if (emailEnabled !== undefined) {
        updates.push('emailEnabled = ?');
        params.push(emailEnabled);
      }
      
      if (pushEnabled !== undefined) {
        updates.push('pushEnabled = ?');
        params.push(pushEnabled);
      }
      
      if (inAppEnabled !== undefined) {
        updates.push('inAppEnabled = ?');
        params.push(inAppEnabled);
      }
      
      if (subscribedTypes) {
        updates.push('subscribedTypes = ?');
        params.push(JSON.stringify(subscribedTypes));
      }
      
      if (unsubscribedTypes) {
        updates.push('unsubscribedTypes = ?');
        params.push(JSON.stringify(unsubscribedTypes));
      }
      
      updates.push('updatedAt = NOW()');
      params.push(userId);
      
      await pool.query(
        `UPDATE notification_preferences SET ${updates.join(', ')} WHERE userId = ?`,
        params
      );
    } else {
      // Create new preferences
      await pool.query(
        `INSERT INTO notification_preferences 
         (userId, emailEnabled, pushEnabled, inAppEnabled, subscribedTypes, unsubscribedTypes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          emailEnabled !== undefined ? emailEnabled : true,
          pushEnabled !== undefined ? pushEnabled : true,
          inAppEnabled !== undefined ? inAppEnabled : true,
          subscribedTypes ? JSON.stringify(subscribedTypes) : JSON.stringify([]),
          unsubscribedTypes ? JSON.stringify(unsubscribedTypes) : JSON.stringify([]),
        ]
      );
    }
    
    // Fetch and return updated preferences
    const [prefRows] = await pool.query(
      `SELECT * FROM notification_preferences WHERE userId = ?`,
      [userId]
    );
    
    const preferences = (prefRows as any[])[0];
    
    if (preferences) {
      // Parse JSON fields
      if (preferences.subscribedTypes) {
        preferences.subscribedTypes = JSON.parse(preferences.subscribedTypes);
      }
      
      if (preferences.unsubscribedTypes) {
        preferences.unsubscribedTypes = JSON.parse(preferences.unsubscribedTypes);
      }
    }
    
    return preferences || null;
  }

  // Helper methods for sending notifications through different channels
  private async sendEmailNotification(notification: any) {
    // For simplicity, we'll just log this for now
    // In a real app, you would integrate with your email service
    try {
      // Send as a generic email if sendNotificationEmail doesn't exist
      await emailService.sendEmail({
        to: notification.userId,
        subject: notification.title,
        text: notification.content,
        html: `<h1>${notification.title}</h1><p>${notification.content}</p>`,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  private async sendPushNotification(notification: any) {
    // For simplicity, we'll just log this for now
    // In a real app, you would integrate with a push notification service
    try {
      // This would be actual push notification code
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  async getNotificationStats(userId: string, days = 30) {
    try {
      // Get all notifications for this user in the last X days
      const [rows] = await pool.query(
        `SELECT status, DATE(createdAt) as date, COUNT(*) as count
         FROM notifications
         WHERE userId = ? AND createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY status, DATE(createdAt)
         ORDER BY date ASC`,
        [userId, days]
      );
      
      const notifications = rows as any[];
      
      // Create date range for the chart
      const dateRange: string[] = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateRange.push(date.toISOString().split('T')[0]);
      }
      
      // Initialize stats object
      const stats = {
        dates: dateRange,
        unread: new Array(dateRange.length).fill(0),
        read: new Array(dateRange.length).fill(0),
        archived: new Array(dateRange.length).fill(0),
      };
      
      // Populate stats from db results
      notifications.forEach(item => {
        const dateIndex = dateRange.indexOf(item.date);
        if (dateIndex !== -1) {
          if (item.status === NotificationStatus.UNREAD) {
            stats.unread[dateIndex] = parseInt(item.count);
          } else if (item.status === NotificationStatus.READ) {
            stats.read[dateIndex] = parseInt(item.count);
          } else if (item.status === NotificationStatus.ARCHIVED) {
            stats.archived[dateIndex] = parseInt(item.count);
          }
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        dates: [] as string[],
        unread: [] as number[],
        read: [] as number[],
        archived: [] as number[],
      };
    }
  }

  async getTotalCount(userId: string): Promise<number> {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM notifications WHERE userId = ?`,
        [userId]
      );
      
      return (rows as any[])[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total notification count:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();