import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationService.getUnreadCount(session.user.id);

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification count' },
      { status: 500 }
    );
  }
}