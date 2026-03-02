import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { NotificationStatus } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification statistics for the user
    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = ? THEN 1 END) as unread,
        COUNT(CASE WHEN status = ? THEN 1 END) as \`read\`,
        COUNT(CASE WHEN status = ? THEN 1 END) as archived
       FROM notifications 
       WHERE userId = ?`,
      [
        NotificationStatus.UNREAD,
        NotificationStatus.READ,
        NotificationStatus.ARCHIVED,
        session.user.id
      ]
    );

    const stats = (statsRows as any[])[0] || {
      total: 0,
      unread: 0,
      read: 0,
      archived: 0
    };

    // Get stats by type
    const [typeStatsRows] = await pool.query(
      `SELECT 
        type,
        COUNT(*) as count
       FROM notifications 
       WHERE userId = ?
       GROUP BY type`,
      [session.user.id]
    );

    const byType: Record<string, number> = {};
    (typeStatsRows as any[]).forEach(row => {
      byType[row.type] = parseInt(row.count) || 0;
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

    return NextResponse.json({ 
      total: parseInt(stats.total) || 0,
      unread: parseInt(stats.unread) || 0,
      byStatus: {
        [NotificationStatus.READ]: parseInt(stats.read) || 0,
        [NotificationStatus.ARCHIVED]: parseInt(stats.archived) || 0,
        [NotificationStatus.UNREAD]: parseInt(stats.unread) || 0
      },
      byType,
      recent: (recentRows as any[]) || []
    });
  } catch (error: any) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification stats' },
      { status: 500 }
    );
  }
}
