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
   * Get vendor users for bulk notifications
   */
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

export default NotificationService;