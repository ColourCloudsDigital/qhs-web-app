// Customer Notification Service
// Handles all notification triggers for customer events

import { notificationService } from './notification.service';
import { NotificationType, NotificationRecipient } from '@/lib/types/enums';
import pool from '@/lib/db';

export interface BookingNotificationData {
  bookingId: string;
  customerId: string;
  userId: string;
  hotelName: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
}

export interface PaymentNotificationData {
  paymentId: string;
  bookingId: string;
  customerId: string;
  userId: string;
  amount: number;
  status: string;
  hotelName: string;
  paymentMethod: string;
}

export interface SubscriptionNotificationData {
  subscriptionId: string;
  userId: string;
  planName: string;
  status: string;
  expiryDate?: string;
  amount?: number;
}

export interface MessageNotificationData {
  messageId: string;
  userId: string;
  senderName: string;
  subject: string;
  content: string;
  type: 'order' | 'request' | 'general';
}

export interface AnnouncementNotificationData {
  announcementId: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'customers' | 'vendors' | 'staff';
}

export interface SystemNotificationData {
  title: string;
  content: string;
  userId?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

class CustomerNotificationService {
  /**
   * Send booking-related notifications
   */
  async sendBookingNotification(type: 'created' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'modified', data: BookingNotificationData) {
    try {
      let title = '';
      let content = '';
      
      switch (type) {
        case 'created':
          title = 'Booking Created';
          content = `Your booking at ${data.hotelName} for ${data.roomName} has been created. Check-in: ${data.checkInDate}, Check-out: ${data.checkOutDate}. Total: ₦${data.totalAmount.toLocaleString()}`;
          break;
        case 'confirmed':
          title = 'Booking Confirmed';
          content = `Your booking at ${data.hotelName} for ${data.roomName} has been confirmed. Check-in: ${data.checkInDate}, Check-out: ${data.checkOutDate}. Total: ₦${data.totalAmount.toLocaleString()}`;
          break;
        case 'cancelled':
          title = 'Booking Cancelled';
          content = `Your booking at ${data.hotelName} for ${data.roomName} has been cancelled. If you have any questions, please contact customer support.`;
          break;
        case 'checked_in':
          title = 'Check-in Confirmed';
          content = `Welcome to ${data.hotelName}! Your check-in has been confirmed for ${data.roomName}. Enjoy your stay!`;
          break;
        case 'checked_out':
          title = 'Check-out Complete';
          content = `Thank you for staying at ${data.hotelName}! Your check-out has been processed. We hope you enjoyed your stay.`;
          break;
        case 'modified':
          title = 'Booking Modified';
          content = `Your booking at ${data.hotelName} has been updated. New details: Check-in: ${data.checkInDate}, Check-out: ${data.checkOutDate}. Total: ₦${data.totalAmount.toLocaleString()}`;
          break;
      }

      await notificationService.createNotification({
        title,
        content,
        type: NotificationType.BOOKING,
        recipient: NotificationRecipient.CUSTOMERS,
        userId: data.userId,
        metadata: {
          bookingId: data.bookingId,
          hotelName: data.hotelName,
          roomName: data.roomName,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          totalAmount: data.totalAmount,
          action: `booking_${type}`,
          notificationType: 'booking'
        }
      });
    } catch (error) {
      console.error(`Failed to send booking ${type} notification:`, error);
    }
  }

  /**
   * Send payment-related notifications
   */
  async sendPaymentNotification(type: 'pending' | 'completed' | 'failed' | 'refunded', data: PaymentNotificationData) {
    try {
      let title = '';
      let content = '';
      
      switch (type) {
        case 'pending':
          title = 'Payment Pending';
          content = `Your payment of ₦${data.amount.toLocaleString()} for booking at ${data.hotelName} is being processed. You will be notified once it's confirmed.`;
          break;
        case 'completed':
          title = 'Payment Confirmed';
          content = `Your payment of ₦${data.amount.toLocaleString()} for booking at ${data.hotelName} has been successfully processed. Your booking is now confirmed.`;
          break;
        case 'failed':
          title = 'Payment Failed';
          content = `Your payment of ₦${data.amount.toLocaleString()} for booking at ${data.hotelName} could not be processed. Please try again or contact support.`;
          break;
        case 'refunded':
          title = 'Payment Refunded';
          content = `Your payment of ₦${data.amount.toLocaleString()} for booking at ${data.hotelName} has been refunded. It may take 3-5 business days to reflect in your account.`;
          break;
      }

      await notificationService.createNotification({
        title,
        content,
        type: NotificationType.PAYMENT,
        recipient: NotificationRecipient.CUSTOMERS,
        userId: data.userId,
        metadata: {
          paymentId: data.paymentId,
          bookingId: data.bookingId,
          amount: data.amount,
          hotelName: data.hotelName,
          paymentMethod: data.paymentMethod,
          action: `payment_${type}`,
          notificationType: 'payment'
        }
      });
    } catch (error) {
      console.error(`Failed to send payment ${type} notification:`, error);
    }
  }

  /**
   * Send subscription-related notifications
   */
  async sendSubscriptionNotification(type: 'created' | 'renewed' | 'expired' | 'cancelled' | 'expiring_soon', data: SubscriptionNotificationData) {
    try {
      let title = '';
      let content = '';
      
      switch (type) {
        case 'created':
          title = 'Subscription Activated';
          content = `Your ${data.planName} subscription has been activated. Welcome to premium features!`;
          break;
        case 'renewed':
          title = 'Subscription Renewed';
          content = `Your ${data.planName} subscription has been renewed${data.expiryDate ? ` until ${data.expiryDate}` : ''}. Thank you for continuing with us!`;
          break;
        case 'expired':
          title = 'Subscription Expired';
          content = `Your ${data.planName} subscription has expired. Renew now to continue enjoying premium features.`;
          break;
        case 'cancelled':
          title = 'Subscription Cancelled';
          content = `Your ${data.planName} subscription has been cancelled. You can reactivate it anytime from your account settings.`;
          break;
        case 'expiring_soon':
          title = 'Subscription Expiring Soon';
          content = `Your ${data.planName} subscription will expire on ${data.expiryDate}. Renew now to avoid interruption of services.`;
          break;
      }

      await notificationService.createNotification({
        title,
        content,
        type: NotificationType.SUBSCRIPTION,
        recipient: NotificationRecipient.CUSTOMERS,
        userId: data.userId,
        metadata: {
          subscriptionId: data.subscriptionId,
          planName: data.planName,
          status: data.status,
          expiryDate: data.expiryDate,
          amount: data.amount,
          action: `subscription_${type}`,
          notificationType: 'subscription'
        }
      });
    } catch (error) {
      console.error(`Failed to send subscription ${type} notification:`, error);
    }
  }

  /**
   * Send message notifications (for orders and requests)
   */
  async sendMessageNotification(data: MessageNotificationData) {
    try {
      let title = '';
      let content = '';
      
      switch (data.type) {
        case 'order':
          title = 'New Order Message';
          content = `You have a new message from ${data.senderName} regarding your order: "${data.subject}"`;
          break;
        case 'request':
          title = 'New Request Message';
          content = `You have a new message from ${data.senderName} regarding your request: "${data.subject}"`;
          break;
        case 'general':
          title = 'New Message';
          content = `You have a new message from ${data.senderName}: "${data.subject}"`;
          break;
      }

      await notificationService.createNotification({
        title,
        content,
        type: NotificationType.MESSAGE,
        recipient: NotificationRecipient.CUSTOMERS,
        userId: data.userId,
        metadata: {
          messageId: data.messageId,
          senderName: data.senderName,
          subject: data.subject,
          messageType: data.type,
          action: 'message_received',
          notificationType: 'message'
        }
      });
    } catch (error) {
      console.error('Failed to send message notification:', error);
    }
  }

  /**
   * Send announcement notifications
   */
  async sendAnnouncementNotification(data: AnnouncementNotificationData, userIds?: string[]) {
    try {
      let recipientType = NotificationRecipient.ALL;
      
      switch (data.targetAudience) {
        case 'customers':
          recipientType = NotificationRecipient.CUSTOMERS;
          break;
        case 'vendors':
          recipientType = NotificationRecipient.VENDORS;
          break;
        case 'staff':
          recipientType = NotificationRecipient.STAFF;
          break;
        default:
          recipientType = NotificationRecipient.ALL;
      }

      if (userIds && userIds.length > 0) {
        // Send to specific users
        const promises = userIds.map(userId =>
          notificationService.createNotification({
            title: data.title,
            content: data.content,
            type: NotificationType.ANNOUNCEMENT,
            recipient: NotificationRecipient.CUSTOMERS,
            userId,
            metadata: {
              announcementId: data.announcementId,
              priority: data.priority,
              targetAudience: data.targetAudience,
              action: 'announcement_sent',
              notificationType: 'announcement'
            }
          })
        );
        await Promise.all(promises);
      } else {
        // Send bulk notification
        await notificationService.sendBulkNotification({
          title: data.title,
          content: data.content,
          type: NotificationType.ANNOUNCEMENT,
          recipientType,
          metadata: {
            announcementId: data.announcementId,
            priority: data.priority,
            targetAudience: data.targetAudience,
            action: 'announcement_sent',
            notificationType: 'announcement'
          }
        });
      }
    } catch (error) {
      console.error('Failed to send announcement notification:', error);
    }
  }

  /**
   * Send system notifications
   */
  async sendSystemNotification(data: SystemNotificationData, userIds?: string[]) {
    try {
      if (data.userId) {
        // Send to specific user
        await notificationService.createNotification({
          title: data.title,
          content: data.content,
          type: NotificationType.SYSTEM,
          recipient: NotificationRecipient.CUSTOMERS,
          userId: data.userId,
          metadata: {
            severity: data.severity,
            action: 'system_notification',
            notificationType: 'system'
          }
        });
      } else if (userIds && userIds.length > 0) {
        // Send to specific users
        const promises = userIds.map(userId =>
          notificationService.createNotification({
            title: data.title,
            content: data.content,
            type: NotificationType.SYSTEM,
            recipient: NotificationRecipient.CUSTOMERS,
            userId,
            metadata: {
              severity: data.severity,
              action: 'system_notification',
              notificationType: 'system'
            }
          })
        );
        await Promise.all(promises);
      } else {
        // Send to all users
        await notificationService.sendBulkNotification({
          title: data.title,
          content: data.content,
          type: NotificationType.SYSTEM,
          recipientType: NotificationRecipient.ALL,
          metadata: {
            severity: data.severity,
            action: 'system_notification',
            notificationType: 'system'
          }
        });
      }
    } catch (error) {
      console.error('Failed to send system notification:', error);
    }
  }

  /**
   * Send reminder notifications
   */
  async sendReminderNotifications() {
    try {
      // Check for bookings with check-in tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const [upcomingBookings] = await pool.query(`
        SELECT b.*, h.name as hotelName, r.name as roomName, c.userId
        FROM bookings b
        JOIN hotels h ON b.hotelId = h.id
        JOIN room_units ru ON b.roomUnitId = ru.id
        JOIN rooms r ON ru.roomId = r.id
        JOIN customers c ON b.customerId = c.id
        WHERE DATE(b.checkInDate) = ? AND b.status = 'CONFIRMED'
      `, [tomorrowStr]);

      for (const booking of (upcomingBookings as any[])) {
        await notificationService.createNotification({
          title: 'Check-in Reminder',
          content: `Reminder: Your check-in at ${booking.hotelName} is tomorrow (${booking.checkInDate}). Room: ${booking.roomName}. Have a great stay!`,
          type: NotificationType.BOOKING,
          recipient: NotificationRecipient.CUSTOMERS,
          userId: booking.userId,
          metadata: {
            bookingId: booking.id,
            hotelName: booking.hotelName,
            roomName: booking.roomName,
            checkInDate: booking.checkInDate,
            action: 'check_in_reminder',
            notificationType: 'reminder'
          }
        });
      }

      // Check for subscriptions expiring in 7 days
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const [expiringSubscriptions] = await pool.query(`
        SELECT s.*, u.id as userId, sp.name as planName
        FROM subscriptions s
        JOIN users u ON s.userId = u.id
        JOIN subscription_plans sp ON s.planId = sp.id
        WHERE DATE(s.expiryDate) = ? AND s.status = 'ACTIVE'
      `, [nextWeekStr]);

      for (const subscription of (expiringSubscriptions as any[])) {
        await this.sendSubscriptionNotification('expiring_soon', {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planName: subscription.planName,
          status: subscription.status,
          expiryDate: subscription.expiryDate
        });
      }

    } catch (error) {
      console.error('Failed to send reminder notifications:', error);
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string) {
    try {
      const stats = await notificationService.getNotificationStats(userId);
      return stats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return null;
    }
  }
}

// Create singleton instance
export const customerNotificationService = new CustomerNotificationService();