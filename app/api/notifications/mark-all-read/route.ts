import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification.service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await notificationService.markAllAsRead(session.user.id);

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}