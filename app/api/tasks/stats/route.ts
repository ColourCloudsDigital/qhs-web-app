import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check module access
    const hasAccess = await canAccessModule(
      session.user.id,
      ModuleType.FACILITY_MANAGEMENT
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Module access not included in your subscription plan' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Get task stats using direct queries
    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM facility_tasks 
       WHERE hotelId = ? 
       GROUP BY status`,
      [hotelId]
    ) as [RowDataPacket[], any];

    const [priorityCounts] = await pool.query(
      `SELECT priority, COUNT(*) as count 
       FROM facility_tasks 
       WHERE hotelId = ? 
       GROUP BY priority`,
      [hotelId]
    ) as [RowDataPacket[], any];

    const today = new Date();
    const [overdueTasks] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM facility_tasks 
       WHERE hotelId = ? AND due_date < ? AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [hotelId, today]
    ) as [RowDataPacket[], any];

    const [totalTasks] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM facility_tasks 
       WHERE hotelId = ?`,
      [hotelId]
    ) as [RowDataPacket[], any];

    return NextResponse.json({
      statusCounts: statusCounts || [],
      priorityCounts: priorityCounts || [],
      overdueTasks: overdueTasks[0]?.count || 0,
      totalTasks: totalTasks[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}