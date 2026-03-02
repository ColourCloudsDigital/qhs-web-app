import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification.service';
import { NotificationStatus, NotificationType } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as NotificationStatus | null;
    const type = searchParams.get('type') as NotificationType | null;
    
    // Parse and validate limit and page with proper defaults
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    
    const limit = limitParam ? Math.max(1, parseInt(limitParam) || 10) : 10;
    const page = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1;

    const options: any = { limit, page };
    if (status) options.status = status;
    if (type) options.type = type;

    const { notifications, pagination } = await notificationService.getUserNotifications(
      session.user.id,
      options
    );

    return NextResponse.json({ notifications, pagination });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins and vendors can create notifications
    if (!['SUPER_ADMIN', 'VENDOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permission denied: Only admin and vendors can create notifications' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, type, recipientType, recipientId, metadata, filter } = body;

    // Validate required fields
    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, and type are required' },
        { status: 400 }
      );
    }

    // If it's a bulk notification
    if (recipientType) {
      const result = await notificationService.sendBulkNotification({
        title,
        content,
        type,
        recipientType,
        senderId: session.user.id,
        metadata,
        filter
      });

      return NextResponse.json(result);
    }

    // If it's a single notification
    if (!recipientId) {
      return NextResponse.json(
        { error: 'Missing required field: recipientId is required for single notifications' },
        { status: 400 }
      );
    }

    const notification = await notificationService.createNotification({
      title,
      content,
      type,
      recipient: recipientType || 'USER',
      userId: recipientId,
      senderId: session.user.id,
      metadata
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}
