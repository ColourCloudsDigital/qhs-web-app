import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = params;

    // Fetch the original task
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM facility_tasks WHERE taskId = ?`,
      [taskId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const original = rows[0];
    const newTaskId = require('crypto').randomUUID();

    await pool.query(
      `INSERT INTO facility_tasks (
        taskId, hotelId, title, description, category, priority,
        due_date, staffId, vendorId, roomUnitId, maintenance_type,
        estimated_hours, cost_estimate, is_recurring, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [
        newTaskId,
        original.hotelId,
        `${original.title} (Copy)`,
        original.description,
        original.category,
        original.priority,
        original.due_date,
        original.staffId,
        original.vendorId,
        original.roomUnitId,
        original.maintenance_type,
        original.estimated_hours,
        original.cost_estimate,
        original.is_recurring,
      ]
    );

    return NextResponse.json({ success: true, id: newTaskId });
  } catch (error) {
    console.error('Error duplicating task:', error);
    return NextResponse.json({ error: 'Failed to duplicate task' }, { status: 500 });
  }
}
