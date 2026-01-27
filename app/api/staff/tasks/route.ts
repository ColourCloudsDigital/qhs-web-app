import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { UserRole } from '@/lib/types/enums';

// GET /api/staff/tasks - Get tasks assigned to the current staff member
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Only staff can access this endpoint' }, { status: 403 });
    }

    // Get staff ID from user ID
    const [staffRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, vendorId, hotelId FROM staff WHERE userId = ?`,
      [session.user.id]
    );

    if (staffRows.length === 0) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    const staff = staffRows[0];

    // Get tasks assigned to this staff member
    const [taskRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ft.taskId,
        ft.title,
        ft.description,
        ft.status,
        ft.priority,
        ft.category,
        ft.due_date as dueDate,
        ft.created_at as createdAt,
        ft.updated_at as updatedAt,
        ft.estimated_hours as estimatedHours,
        ft.cost_estimate as actualHours,
        ft.roomUnitId as roomId,
        ft.hotelId,
        h.name as hotelName,
        creator.name as createdByName,
        creator.email as createdByEmail
      FROM facility_tasks ft
      LEFT JOIN hotels h ON ft.hotelId = h.id
      LEFT JOIN staff creator_staff ON ft.staffId = creator_staff.id
      LEFT JOIN users creator ON creator_staff.userId = creator.id
      WHERE ft.staffId = ?
      ORDER BY 
        CASE 
          WHEN ft.status = 'PENDING' THEN 1
          WHEN ft.status = 'IN_PROGRESS' THEN 2
          WHEN ft.status = 'COMPLETED' THEN 3
          ELSE 4
        END,
        ft.priority DESC,
        ft.due_date ASC`,
      [staff.id]
    );

    // Calculate statistics
    const stats = {
      totalAssigned: taskRows.length,
      pendingTasks: taskRows.filter(task => task.status === 'PENDING').length,
      inProgressTasks: taskRows.filter(task => task.status === 'IN_PROGRESS').length,
      completedTasks: taskRows.filter(task => task.status === 'COMPLETED').length,
      overdueTasks: taskRows.filter(task => 
        new Date(task.dueDate) < new Date() && 
        task.status !== 'COMPLETED' && 
        task.status !== 'CANCELLED'
      ).length
    };

    // Format tasks for response
    const tasks = taskRows.map(task => ({
      id: task.taskId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      room: task.roomId ? {
        id: task.roomId,
        name: `Room Unit ${task.roomId}`
      } : null,
      hotel: task.hotelId ? {
        id: task.hotelId,
        name: task.hotelName
      } : null,
      createdBy: {
        name: task.createdByName || 'Unknown',
        email: task.createdByEmail || ''
      }
    }));

    return NextResponse.json({
      tasks,
      stats,
      staffInfo: {
        id: staff.id,
        vendorId: staff.vendorId,
        hotelId: staff.hotelId
      }
    });

  } catch (error) {
    console.error('Error fetching staff tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}