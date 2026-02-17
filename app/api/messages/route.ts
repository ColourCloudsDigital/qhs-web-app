import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { customerNotificationService } from '@/lib/services/customer-notification.service';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const messageData = await request.json();
    const { recipientId, subject, content, type = 'general' } = messageData;

    // Validate required fields
    if (!recipientId || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, subject, content' },
        { status: 400 }
      );
    }

    // Get sender details
    const [senderRows] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [session.user.id]
    );

    const sender = (senderRows as any[])[0];
    const senderName = sender?.name || 'System';

    // Create message record
    const messageId = uuidv4();
    await pool.query(
      `INSERT INTO messages (id, senderId, recipientId, subject, content, type, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'UNREAD', NOW(), NOW())`,
      [messageId, session.user.id, recipientId, subject, content, type]
    );

    // Send notification to recipient
    await customerNotificationService.sendMessageNotification({
      messageId,
      userId: recipientId,
      senderName,
      subject,
      content,
      type: type as 'order' | 'request' | 'general'
    });

    return NextResponse.json({ 
      success: true, 
      messageId,
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
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
    const type = searchParams.get('type');

    let whereClause = 'WHERE recipientId = ?';
    const queryParams = [session.user.id];

    if (type) {
      whereClause += ' AND type = ?';
      queryParams.push(type);
    }

    // Get messages for the user
    const [messages] = await pool.query(
      `SELECT m.*, u.name as senderName
       FROM messages m
       LEFT JOIN users u ON m.senderId = u.id
       ${whereClause}
       ORDER BY m.createdAt DESC
       LIMIT ?, ?`,
      [...queryParams, (page - 1) * limit, limit]
    );

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM messages ${whereClause}`,
      queryParams
    );

    const total = (countRows as any[])[0].total;

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}