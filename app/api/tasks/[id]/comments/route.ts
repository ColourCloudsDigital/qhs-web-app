import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { UserRole } from '@/lib/types/enums';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tasks/[id]/comments - Get all comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

    // Get comments with user information
    const [comments] = await pool.query<RowDataPacket[]>(
      `SELECT 
        tc.commentId,
        tc.taskId,
        tc.staffId,
        tc.comment_text,
        tc.created_at,
        tc.updated_at,
        u.name as authorName,
        u.email as authorEmail,
        s.position as authorPosition
      FROM task_comments tc
      JOIN staff s ON tc.staffId = s.id
      JOIN users u ON s.userId = u.id
      WHERE tc.taskId = ?
      ORDER BY tc.created_at ASC`,
      [taskId]
    );

    return NextResponse.json({
      comments: comments.map(comment => ({
        id: comment.commentId,
        taskId: comment.taskId,
        content: comment.comment_text,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          id: comment.staffId,
          name: comment.authorName,
          email: comment.authorEmail,
          position: comment.authorPosition
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Add a new comment to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff can add comments
    if (session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Only staff can add comments' }, { status: 403 });
    }

    const taskId = params.id;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Get staff ID from user ID
    const [staffRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM staff WHERE userId = ?`,
      [session.user.id]
    );

    if (staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    const staffId = staffRows[0].id;

    // Verify task exists and staff has access to it
    const [taskRows] = await pool.query<RowDataPacket[]>(
      `SELECT ft.taskId, ft.staffId as assignedTo, s.vendorId as staffVendorId, ft.vendorId as taskVendorId
      FROM facility_tasks ft
      LEFT JOIN staff s ON s.id = ?
      WHERE ft.taskId = ?`,
      [staffId, taskId]
    );

    if (taskRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskRows[0];

    // Check if staff has access to this task (either assigned to them or same vendor)
    if (task.assignedTo !== staffId && task.staffVendorId !== task.taskVendorId) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Insert the comment
    const commentId = uuidv4();
    const [result] = await pool.query(
      `INSERT INTO task_comments (commentId, taskId, staffId, comment_text) VALUES (?, ?, ?, ?)`,
      [commentId, taskId, staffId, content.trim()]
    );

    // Get the inserted comment with user information
    const [newComment] = await pool.query<RowDataPacket[]>(
      `SELECT 
        tc.commentId,
        tc.taskId,
        tc.staffId,
        tc.comment_text,
        tc.created_at,
        tc.updated_at,
        u.name as authorName,
        u.email as authorEmail,
        s.position as authorPosition
      FROM task_comments tc
      JOIN staff s ON tc.staffId = s.id
      JOIN users u ON s.userId = u.id
      WHERE tc.commentId = ?`,
      [commentId]
    );

    if (newComment.length === 0) {
      return NextResponse.json({ error: 'Failed to retrieve created comment' }, { status: 500 });
    }

    const comment = newComment[0];

    return NextResponse.json({
      comment: {
        id: comment.commentId,
        taskId: comment.taskId,
        content: comment.comment_text,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          id: comment.staffId,
          name: comment.authorName,
          email: comment.authorEmail,
          position: comment.authorPosition
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}