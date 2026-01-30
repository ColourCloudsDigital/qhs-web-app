import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType, NotificationStatus } from '@/lib/types/enums';

interface CreateNotificationParams {
  title: string;
  content: string;
  type: NotificationType;
  userId: string;
  senderId?: string;
  metadata?: any;
  recipient?: string;
}

interface NotificationMetadata {
  bookingId?: string;
  hotelId?: string;
  roomId?: string;
  customerId?: string;
  paymentId?: string;
  taskId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  oldValue?: any;
  newValue?: any;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams): Promise<string> {
    try {
      const notificationId = uuidv4();
      const now = new Date();

      await pool.query(
        `INSERT INTO notifications (
          id, title, content, type, recipient, userId, senderId, metadata, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notificationId,
          params.title,
          params.content,
          params.type,
          params.recipient || 'USER',
          params.userId,
          params.senderId || null,
          params.metadata ? JSON.stringify(params.metadata) : null,
          NotificationStatus.UNREAD,
          now,
          now
        ]
      );

      console.log(`[NotificationService] Created notification ${notificationId} for user ${params.userId}`);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(
    users: string[],
    notification: Omit<CreateNotificationParams, 'userId'>
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const userId of users) {
      try {
        const id = await this.createNotification({
          ...notification,
          userId
        });
        notificationIds.push(id);
      } catch (error) {
        console.error(`[NotificationService] Failed to create notification for user ${userId}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Booking-related notifications
   */
  static async notifyBookingCreated(
    userId: string,
    bookingId: string,
    customerName: string,
    hotelName: string,
    roomNumber: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'New Booking Created',
      content: `New booking created for ${customerName} in room ${roomNumber} at ${hotelName}`,
      type: NotificationType.BOOKING,
      userId,
      senderId,
      metadata: {
        bookingId,
        action: 'created',
        entityType: 'booking'
      }
    });
  }

  static async notifyBookingUpdated(
    userId: string,
    bookingId: string,
    customerName: string,
    changes: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Booking Updated',
      content: `Booking for ${customerName} has been updated: ${changes}`,
      type: NotificationType.BOOKING,
      userId,
      senderId,
      metadata: {
        bookingId,
        action: 'updated',
        entityType: 'booking'
      }
    });
  }

  static async notifyBookingCheckedIn(
    userId: string,
    bookingId: string,
    customerName: string,
    roomNumber: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Guest Checked In',
      content: `${customerName} has checked in to room ${roomNumber}`,
      type: NotificationType.BOOKING,
      userId,
      senderId,
      metadata: {
        bookingId,
        action: 'checked_in',
        entityType: 'booking'
      }
    });
  }

  static async notifyBookingCheckedOut(
    userId: string,
    bookingId: string,
    customerName: string,
    roomNumber: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Guest Checked Out',
      content: `${customerName} has checked out from room ${roomNumber}`,
      type: NotificationType.BOOKING,
      userId,
      senderId,
      metadata: {
        bookingId,
        action: 'checked_out',
        entityType: 'booking'
      }
    });
  }

  static async notifyBookingCancelled(
    userId: string,
    bookingId: string,
    customerName: string,
    reason?: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Booking Cancelled',
      content: `Booking for ${customerName} has been cancelled${reason ? `: ${reason}` : ''}`,
      type: NotificationType.BOOKING,
      userId,
      senderId,
      metadata: {
        bookingId,
        action: 'cancelled',
        entityType: 'booking'
      }
    });
  }

  /**
   * Payment-related notifications
   */
  static async notifyPaymentReceived(
    userId: string,
    paymentId: string,
    amount: number,
    customerName: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Payment Received',
      content: `Payment of ₦${amount.toLocaleString()} received from ${customerName}`,
      type: NotificationType.PAYMENT,
      userId,
      senderId,
      metadata: {
        paymentId,
        action: 'received',
        entityType: 'payment'
      }
    });
  }

  static async notifyPaymentFailed(
    userId: string,
    paymentId: string,
    amount: number,
    customerName: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Payment Failed',
      content: `Payment of ₦${amount.toLocaleString()} from ${customerName} has failed`,
      type: NotificationType.PAYMENT,
      userId,
      senderId,
      metadata: {
        paymentId,
        action: 'failed',
        entityType: 'payment'
      }
    });
  }

  /**
   * Hotel/Room management notifications
   */
  static async notifyRoomStatusChanged(
    userId: string,
    roomId: string,
    roomNumber: string,
    oldStatus: string,
    newStatus: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Room Status Updated',
      content: `Room ${roomNumber} status changed from ${oldStatus} to ${newStatus}`,
      type: NotificationType.SYSTEM,
      userId,
      senderId,
      metadata: {
        roomId,
        action: 'status_changed',
        entityType: 'room',
        oldValue: oldStatus,
        newValue: newStatus
      }
    });
  }

  static async notifyHotelUpdated(
    userId: string,
    hotelId: string,
    hotelName: string,
    changes: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Hotel Information Updated',
      content: `${hotelName} information has been updated: ${changes}`,
      type: NotificationType.SYSTEM,
      userId,
      senderId,
      metadata: {
        hotelId,
        action: 'updated',
        entityType: 'hotel'
      }
    });
  }

  /**
   * Maintenance/Task notifications
   */
  static async notifyTaskCreated(
    userId: string,
    taskId: string,
    taskTitle: string,
    priority: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'New Task Assigned',
      content: `New ${priority.toLowerCase()} priority task: ${taskTitle}`,
      type: NotificationType.MAINTENANCE,
      userId,
      senderId,
      metadata: {
        taskId,
        action: 'created',
        entityType: 'task'
      }
    });
  }

  static async notifyTaskCompleted(
    userId: string,
    taskId: string,
    taskTitle: string,
    senderId?: string
  ) {
    return this.createNotification({
      title: 'Task Completed',
      content: `Task completed: ${taskTitle}`,
      type: NotificationType.MAINTENANCE,
      userId,
      senderId,
      metadata: {
        taskId,
        action: 'completed',
        entityType: 'task'
      }
    });
  }

  /**
   * System notifications
   */
  static async notifySystemUpdate(
    userId: string,
    title: string,
    content: string,
    senderId?: string
  ) {
    return this.createNotification({
      title,
      content,
      type: NotificationType.SYSTEM,
      userId,
      senderId,
      metadata: {
        action: 'system_update',
        entityType: 'system'
      }
    });
  }

  /**
   * Get notifications for a user with pagination and filtering
   */
  static async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 10, status, type } = options;
      const offset = (page - 1) * limit;

      // Build WHERE conditions
      const whereConditions: string[] = ['userId = ?'];
      const params: any[] = [userId];

      if (status) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      if (type) {
        whereConditions.push('type = ?');
        params.push(type);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get notifications with count
      const [notificationsResult, countResult] = await Promise.all([
        pool.query(`
          SELECT id, title, content, type, status, metadata, createdAt, updatedAt
          FROM notifications
          WHERE ${whereClause}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `, [...params, limit, offset]),
        pool.query(`
          SELECT COUNT(*) as total
          FROM notifications
          WHERE ${whereClause}
        `, params)
      ]);

      const notifications = (notificationsResult as any[])[0] || [];
      const total = (countResult as any[])[0][0]?.total || 0;

      // Parse metadata for each notification
      const formattedNotifications = notifications.map((notification: any) => ({
        ...notification,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        notifications: formattedNotifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string) {
    try {
      const [statsRows] = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'UNREAD' THEN 1 END) as unread,
          COUNT(CASE WHEN status = 'READ' THEN 1 END) as \`read\`,
          COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archived
         FROM notifications 
         WHERE userId = ?`,
        [userId]
      );

      const stats = (statsRows as any[])[0] || {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0
      };

      return {
        total: parseInt(stats.total) || 0,
        unread: parseInt(stats.unread) || 0,
        byStatus: {
          read: parseInt(stats.read) || 0,
          ARCHIVED: parseInt(stats.archived) || 0,
          UNREAD: parseInt(stats.unread) || 0
        }
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotification(params: {
    title: string;
    content: string;
    type: string;
    recipientType: string;
    senderId?: string;
    metadata?: any;
    filter?: any;
  }) {
    try {
      let userIds: string[] = [];

      // Get users based on recipient type
      switch (params.recipientType) {
        case 'CUSTOMERS':
          const [customers] = await pool.query(
            'SELECT userId FROM customers WHERE userId IS NOT NULL'
          );
          userIds = (customers as any[]).map(c => c.userId);
          break;
        case 'VENDORS':
          const [vendors] = await pool.query(
            'SELECT id FROM users WHERE role = "VENDOR"'
          );
          userIds = (vendors as any[]).map(v => v.id);
          break;
        case 'STAFF':
          const [staff] = await pool.query(
            'SELECT userId FROM staff WHERE userId IS NOT NULL'
          );
          userIds = (staff as any[]).map(s => s.userId);
          break;
        case 'ALL':
        default:
          const [allUsers] = await pool.query(
            'SELECT id FROM users'
          );
          userIds = (allUsers as any[]).map(u => u.id);
          break;
      }

      // Create notifications for all users
      const promises = userIds.map(userId =>
        this.createNotification({
          title: params.title,
          content: params.content,
          type: params.type as NotificationType,
          recipient: 'USER',
          userId,
          senderId: params.senderId,
          metadata: params.metadata
        })
      );

      await Promise.all(promises);

      return {
        success: true,
        message: `Bulk notification sent to ${userIds.length} users`,
        recipientCount: userIds.length
      };
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: {
      emailEnabled: boolean;
      pushEnabled: boolean;
      inAppEnabled: boolean;
      subscribedTypes: string[];
      unsubscribedTypes: string[];
    }
  ) {
    try {
      const now = new Date();
      
      // Check if preferences already exist
      const [existing] = await pool.query(
        'SELECT id FROM notification_preferences WHERE userId = ?',
        [userId]
      );

      const subscribedTypesJson = JSON.stringify(preferences.subscribedTypes);
      const unsubscribedTypesJson = JSON.stringify(preferences.unsubscribedTypes);

      if (existing && (existing as any[]).length > 0) {
        // Update existing preferences
        await pool.query(
          `UPDATE notification_preferences 
           SET emailEnabled = ?, pushEnabled = ?, inAppEnabled = ?, 
               subscribedTypes = ?, unsubscribedTypes = ?, updatedAt = ?
           WHERE userId = ?`,
          [
            preferences.emailEnabled ? 1 : 0,
            preferences.pushEnabled ? 1 : 0,
            preferences.inAppEnabled ? 1 : 0,
            subscribedTypesJson,
            unsubscribedTypesJson,
            now,
            userId
          ]
        );
      } else {
        // Insert new preferences
        const preferenceId = uuidv4();
        await pool.query(
          `INSERT INTO notification_preferences 
           (id, userId, emailEnabled, pushEnabled, inAppEnabled, subscribedTypes, unsubscribedTypes, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            preferenceId,
            userId,
            preferences.emailEnabled ? 1 : 0,
            preferences.pushEnabled ? 1 : 0,
            preferences.inAppEnabled ? 1 : 0,
            subscribedTypesJson,
            unsubscribedTypesJson,
            now,
            now
          ]
        );
      }

      // Return the updated preferences
      return {
        emailEnabled: preferences.emailEnabled ? 1 : 0,
        pushEnabled: preferences.pushEnabled ? 1 : 0,
        inAppEnabled: preferences.inAppEnabled ? 1 : 0,
        subscribedTypes: preferences.subscribedTypes,
        unsubscribedTypes: preferences.unsubscribedTypes
      };
    } catch (error) {
      console.error('[NotificationService] Error updating notification preferences:', error);
      throw error;
    }
  }

  static async getVendorUsers(vendorId: string): Promise<string[]> {
    try {
      const [users] = await pool.query(
        `SELECT u.id FROM users u 
         JOIN vendors v ON u.id = v.userId 
         WHERE v.id = ?
         UNION
         SELECT u.id FROM users u 
         JOIN staff s ON u.id = s.userId 
         JOIN hotels h ON s.hotelId = h.id 
         WHERE h.vendorId = ?`,
        [vendorId, vendorId]
      );

      return (users as any[]).map(user => user.id);
    } catch (error) {
      console.error('[NotificationService] Error getting vendor users:', error);
      return [];
    }
  }

  /**
   * Get hotel staff for notifications
   */
  static async getHotelStaff(hotelId: string): Promise<string[]> {
    try {
      const [staff] = await pool.query(
        `SELECT u.id FROM users u 
         JOIN staff s ON u.id = s.userId 
         WHERE s.hotelId = ?`,
        [hotelId]
      );

      return (staff as any[]).map(user => user.id);
    } catch (error) {
      console.error('[NotificationService] Error getting hotel staff:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService;
export default NotificationService;