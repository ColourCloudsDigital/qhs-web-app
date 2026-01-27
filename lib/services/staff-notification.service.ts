import { notificationService } from './notification.service';
import { NotificationType, NotificationRecipient } from '@/lib/types/enums';
import pool from '@/lib/db';

interface StaffNotificationData {
  title: string;
  content: string;
  type: NotificationType;
  userId?: string;
  staffId?: string;
  hotelId?: string;
  metadata?: any;
  senderId?: string;
}

class StaffNotificationService {
  // Send notification to a specific staff member
  async notifyStaff(data: StaffNotificationData) {
    try {
      let targetUserId = data.userId;

      // If staffId is provided but not userId, get userId from staff record
      if (!targetUserId && data.staffId) {
        const [staffRows] = await pool.execute(
          'SELECT userId FROM staff WHERE id = ?',
          [data.staffId]
        );
        
        if (Array.isArray(staffRows) && staffRows.length > 0) {
          targetUserId = (staffRows[0] as any).userId;
        }
      }

      if (!targetUserId) {
        throw new Error('No target user ID found');
      }

      return await notificationService.createNotification({
        title: data.title,
        content: data.content,
        type: data.type,
        recipient: NotificationRecipient.STAFF,
        userId: targetUserId,
        senderId: data.senderId,
        metadata: data.metadata
      });
    } catch (error) {
      console.error('Error sending staff notification:', error);
      throw error;
    }
  }

  // Send notification to all staff in a hotel
  async notifyHotelStaff(data: StaffNotificationData & { hotelId: string }) {
    try {
      // Get all staff members in the hotel
      const [staffRows] = await pool.execute(
        'SELECT userId FROM staff WHERE hotelId = ?',
        [data.hotelId]
      );

      const staffUserIds = (staffRows as any[]).map(staff => staff.userId);

      // Send notification to each staff member
      const promises = staffUserIds.map(userId =>
        notificationService.createNotification({
          title: data.title,
          content: data.content,
          type: data.type,
          recipient: NotificationRecipient.STAFF,
          userId,
          senderId: data.senderId,
          metadata: data.metadata
        })
      );

      await Promise.all(promises);
      return { success: true, count: staffUserIds.length };
    } catch (error) {
      console.error('Error sending hotel staff notifications:', error);
      throw error;
    }
  }

  // Send notification to staff with specific permissions
  async notifyStaffWithPermission(data: StaffNotificationData & { permission: string; hotelId?: string }) {
    try {
      let query = `
        SELECT s.userId 
        FROM staff s 
        WHERE JSON_CONTAINS(s.permissions, JSON_QUOTE(?))
      `;
      const params = [data.permission];

      if (data.hotelId) {
        query += ' AND s.hotelId = ?';
        params.push(data.hotelId);
      }

      const [staffRows] = await pool.execute(query, params);
      const staffUserIds = (staffRows as any[]).map(staff => staff.userId);

      // Send notification to each staff member
      const promises = staffUserIds.map(userId =>
        notificationService.createNotification({
          title: data.title,
          content: data.content,
          type: data.type,
          recipient: NotificationRecipient.STAFF,
          userId,
          senderId: data.senderId,
          metadata: data.metadata
        })
      );

      await Promise.all(promises);
      return { success: true, count: staffUserIds.length };
    } catch (error) {
      console.error('Error sending permission-based staff notifications:', error);
      throw error;
    }
  }

  // Notification templates for common staff actions
  async notifyStaffCreated(staffData: { name: string; position: string; hotelId: string }, createdBy: string) {
    return this.notifyStaffWithPermission({
      title: 'New Staff Member Added',
      content: `${staffData.name} has been added as ${staffData.position}`,
      type: NotificationType.SYSTEM,
      permission: 'staff',
      hotelId: staffData.hotelId,
      senderId: createdBy,
      metadata: {
        action: 'staff_created',
        staffName: staffData.name,
        position: staffData.position
      }
    });
  }

  async notifyTaskAssigned(taskData: { title: string; staffId: string; assignedBy: string; dueDate: string }) {
    return this.notifyStaff({
      title: 'New Task Assigned',
      content: `You have been assigned a new task: ${taskData.title}`,
      type: NotificationType.MAINTENANCE,
      staffId: taskData.staffId,
      senderId: taskData.assignedBy,
      metadata: {
        action: 'task_assigned',
        taskTitle: taskData.title,
        dueDate: taskData.dueDate
      }
    });
  }

  async notifyCustomerCreated(customerData: { name: string; email: string; hotelId: string }, createdBy: string) {
    return this.notifyStaffWithPermission({
      title: 'New Customer Added',
      content: `New customer ${customerData.name} has been added to the system`,
      type: NotificationType.SYSTEM,
      permission: 'customers',
      hotelId: customerData.hotelId,
      senderId: createdBy,
      metadata: {
        action: 'customer_created',
        customerName: customerData.name,
        customerEmail: customerData.email
      }
    });
  }

  async notifyRoomStatusChanged(roomData: { roomNumber: string; status: string; hotelId: string }, changedBy: string) {
    return this.notifyStaffWithPermission({
      title: 'Room Status Updated',
      content: `Room ${roomData.roomNumber} status changed to ${roomData.status}`,
      type: NotificationType.SYSTEM,
      permission: 'rooms',
      hotelId: roomData.hotelId,
      senderId: changedBy,
      metadata: {
        action: 'room_status_changed',
        roomNumber: roomData.roomNumber,
        status: roomData.status
      }
    });
  }

  async notifyPaymentProcessed(paymentData: { amount: number; customerName: string; hotelId: string }, processedBy: string) {
    return this.notifyStaffWithPermission({
      title: 'Payment Processed',
      content: `Payment of $${paymentData.amount} from ${paymentData.customerName} has been processed`,
      type: NotificationType.PAYMENT,
      permission: 'payments',
      hotelId: paymentData.hotelId,
      senderId: processedBy,
      metadata: {
        action: 'payment_processed',
        amount: paymentData.amount,
        customerName: paymentData.customerName
      }
    });
  }

  async notifyBookingCreated(bookingData: { id: string; customerName: string; roomNumber: string; hotelId: string }, createdBy: string) {
    return this.notifyStaffWithPermission({
      title: 'New Booking Created',
      content: `New booking for ${bookingData.customerName} in room ${bookingData.roomNumber}`,
      type: NotificationType.BOOKING,
      permission: 'bookings',
      hotelId: bookingData.hotelId,
      senderId: createdBy,
      metadata: {
        action: 'booking_created',
        bookingId: bookingData.id,
        customerName: bookingData.customerName,
        roomNumber: bookingData.roomNumber
      }
    });
  }

  async notifyTaskCompleted(taskData: { title: string; completedBy: string; hotelId: string }) {
    return this.notifyStaffWithPermission({
      title: 'Task Completed',
      content: `Task "${taskData.title}" has been completed`,
      type: NotificationType.MAINTENANCE,
      permission: 'tasks',
      hotelId: taskData.hotelId,
      senderId: taskData.completedBy,
      metadata: {
        action: 'task_completed',
        taskTitle: taskData.title
      }
    });
  }
}

export const staffNotificationService = new StaffNotificationService();