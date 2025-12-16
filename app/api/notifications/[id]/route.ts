import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification.service';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'mark_read':
        result = await notificationService.markAsRead(id, session.user.id);
        break;
      case 'archive':
        result = await notificationService.archiveNotification(id, session.user.id);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: mark_read, archive' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error(`Error updating notification ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const result = await notificationService.deleteNotification(id, session.user.id);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error(`Error deleting notification ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}