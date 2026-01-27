import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors and super admins can access vendor notifications
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['n.userId = ?'];
    let queryParams: any[] = [session.user.id];
    
    if (search) {
      whereConditions.push('(n.title LIKE ? OR n.content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'all') {
      whereConditions.push('n.status = ?');
      queryParams.push(status);
    }
    
    if (type && type !== 'all') {
      whereConditions.push('n.type = ?');
      queryParams.push(type);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications n WHERE ${whereClause}`,
      queryParams
    );
    
    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Get notifications with sender information
    const [notifications] = await pool.query(
      `SELECT 
        n.id,
        n.title,
        n.content,
        n.type,
        n.status,
        n.metadata,
        n.createdAt,
        n.updatedAt,
        sender.id as senderId,
        sender.name as senderName,
        sender.email as senderEmail
      FROM notifications n
      LEFT JOIN users sender ON n.senderId = sender.id
      WHERE ${whereClause}
      ORDER BY n.createdAt DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // Process notifications
    const processedNotifications = (notifications as any[]).map(notification => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      status: notification.status,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      sender: notification.senderId ? {
        id: notification.senderId,
        name: notification.senderName,
        email: notification.senderEmail
      } : null
    }));
    
    return NextResponse.json({
      notifications: processedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('[API] Error fetching vendor notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}