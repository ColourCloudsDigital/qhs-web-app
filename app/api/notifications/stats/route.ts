import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification.service';
import pool from '@/lib/db';
import { NotificationType, NotificationStatus } from '@/lib/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total count
    const total = await notificationService.getTotalCount(session.user.id);
    
    // Get unread count
    const unread = await notificationService.getUnreadCount(session.user.id);

    // Get notifications by type
    const [typeRows] = await pool.query(
      `SELECT type, COUNT(*) as count
       FROM notifications
       WHERE userId = ?
       GROUP BY type`,
      [session.user.id]
    );

    const byType: Record<NotificationType, number> = {
      SYSTEM: 0,
      BOOKING: 0,
      PAYMENT: 0,
      MAINTENANCE: 0,
      PROMOTION: 0,
      SUBSCRIPTION: 0,
      MESSAGE: 0,
      ANNOUNCEMENT: 0,
      OTHER: 0
    };

    (typeRows as any[]).forEach(row => {
      if (row.type in byType) {
        byType[row.type as NotificationType] = parseInt(row.count);
      }
    });

    // Get notifications by status
    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM notifications
       WHERE userId = ?
       GROUP BY status`,
      [session.user.id]
    );

    const byStatus: Record<NotificationStatus, number> = {
      UNREAD: 0,
      READ: 0,
      ARCHIVED: 0
    };

    (statusRows as any[]).forEach(row => {
      if (row.status in byStatus) {
        byStatus[row.status as NotificationStatus] = parseInt(row.count);
      }
    });

    // Get recent notifications
    const [recentRows] = await pool.query(
      `SELECT id, title, content, type, status, createdAt
       FROM notifications
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT 10`,
      [session.user.id]
    );

    const recent = (recentRows as any[]).map(notification => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }));

    return NextResponse.json({
      total,
      unread,
      byType,
      byStatus,
      recent
    });
  } catch (error: any) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification stats' },
      { status: 500 }
    );
  }
}