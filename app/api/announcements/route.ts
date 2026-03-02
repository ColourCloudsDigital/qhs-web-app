import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { customerNotificationService } from '@/lib/services/customer-notification.service';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and vendors can create announcements
    if (!['SUPER_ADMIN', 'ADMIN', 'VENDOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permission denied: Only admins and vendors can create announcements' },
        { status: 403 }
      );
    }

    const announcementData = await request.json();
    const { title, content, priority = 'medium', targetAudience = 'all', userIds } = announcementData;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      );
    }

    // Create announcement record
    const announcementId = uuidv4();
    await pool.query(
      `INSERT INTO announcements (id, title, content, priority, targetAudience, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [announcementId, title, content, priority, targetAudience, session.user.id]
    );

    // Send notifications
    await customerNotificationService.sendAnnouncementNotification({
      announcementId,
      title,
      content,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      targetAudience: targetAudience as 'all' | 'customers' | 'vendors' | 'staff'
    }, userIds);

    return NextResponse.json({ 
      success: true, 
      announcementId,
      message: 'Announcement created and notifications sent successfully' 
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const priority = searchParams.get('priority');
    const targetAudience = searchParams.get('targetAudience');

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (priority) {
      whereClause += ' AND priority = ?';
      queryParams.push(priority);
    }

    if (targetAudience) {
      whereClause += ' AND (targetAudience = ? OR targetAudience = "all")';
      queryParams.push(targetAudience);
    }

    // Get announcements
    const [announcements] = await pool.query(
      `SELECT a.*, u.name as createdByName
       FROM announcements a
       LEFT JOIN users u ON a.createdBy = u.id
       ${whereClause}
       ORDER BY a.createdAt DESC
       LIMIT ?, ?`,
      [...queryParams, (page - 1) * limit, limit]
    );

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM announcements ${whereClause}`,
      queryParams
    );

    const total = (countRows as any[])[0].total;

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}
