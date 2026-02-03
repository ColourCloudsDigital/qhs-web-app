import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import TaskDashboardClient from '../components/TaskDashboardClient';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import SubscriptionRequired from '@/components/common/SubscriptionRequired';
import { RowDataPacket } from 'mysql2';
import { ModuleType } from '@/lib/types/enums';

export const metadata: Metadata = {
  title: 'Facility Management | Vendor Dashboard',
  description: 'Manage maintenance tasks, staff assignments, and facility operations',
};

async function getVendorHotels(userId: string): Promise<Array<{id: string; name: string}>> {
  try {
    const [hotels] = await pool.query(
      `SELECT h.id, h.name 
       FROM hotels h
       JOIN vendors v ON h.vendorId = v.id
       WHERE v.userId = ?`,
      [userId]
    ) as [RowDataPacket[], any];

    return (hotels || []).map((hotel: RowDataPacket) => ({
      id: hotel.id,
      name: hotel.name
    }));
  } catch (error) {
    console.error('Error fetching vendor hotels:', error);
    return [];
  }
}

async function getTaskStats(hotelId: string) {
  try {
    // Check if facility_tasks table exists first
    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facility_tasks'`
    ) as [RowDataPacket[], any];

    if (!tables || tables.length === 0) {
      // Table doesn't exist, return empty stats
      return {
        statusCounts: [],
        priorityCounts: [],
        overdueTasks: 0,
        totalTasks: 0,
      };
    }

    // Get task counts by status
    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) as _count 
       FROM facility_tasks 
       WHERE hotelId = ? 
       GROUP BY status`,
      [hotelId]
    ) as [RowDataPacket[], any];

    // Get counts by priority
    const [priorityCounts] = await pool.query(
      `SELECT priority, COUNT(*) as _count 
       FROM facility_tasks 
       WHERE hotelId = ? 
       GROUP BY priority`,
      [hotelId]
    ) as [RowDataPacket[], any];

    // Get upcoming/overdue tasks
    const today = new Date();
    const [overdueTasks] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM facility_tasks 
       WHERE hotelId = ? AND due_date < ? AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [hotelId, today]
    ) as [RowDataPacket[], any];

    // Get total tasks
    const [totalTasks] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM facility_tasks 
       WHERE hotelId = ?`,
      [hotelId]
    ) as [RowDataPacket[], any];

    return {
      statusCounts: (statusCounts || []).map((row: RowDataPacket) => ({
        status: row.status,
        _count: row._count
      })),
      priorityCounts: (priorityCounts || []).map((row: RowDataPacket) => ({
        priority: row.priority,
        _count: row._count
      })),
      overdueTasks: overdueTasks[0]?.count || 0,
      totalTasks: totalTasks[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return {
      statusCounts: [],
      priorityCounts: [],
      overdueTasks: 0,
      totalTasks: 0,
    };
  }
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if vendor has active subscription using subscriptionPlanId
  try {
    const [vendorResult] = await pool.query(
      `SELECT subscriptionPlanId, subscriptionStatus FROM vendors WHERE userId = ?`,
      [session.user.id]
    ) as [RowDataPacket[], any];

    if (!vendorResult || vendorResult.length === 0) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Facility Management</h1>
          <div className="bg-red-50 border border-red-200 p-4 rounded-md">
            <p>Vendor not found.</p>
          </div>
        </div>
      );
    }

    const vendor = vendorResult[0];
    const hasSubscription = vendor.subscriptionPlanId && vendor.subscriptionStatus?.toLowerCase() === 'active';

    if (!hasSubscription) {
      return <SubscriptionRequired moduleType={ModuleType.FACILITY_MANAGEMENT} />;
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Facility Management</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p>Error checking subscription. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get vendor hotels
  const hotels = await getVendorHotels(session.user.id);
  
  if (hotels.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Facility Management</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p>You need to add a hotel before you can use the facility management features.</p>
        </div>
      </div>
    );
  }

  // Get stats for the first hotel (default selection)
  const defaultHotelId = hotels[0].id;
  const taskStats = await getTaskStats(defaultHotelId);

  // Get staff for assignment
  try {
    const [staff] = await pool.query(
      `SELECT s.id, s.userId, s.position, u.name, u.email 
       FROM staff s
       JOIN users u ON s.userId = u.id
       WHERE s.hotelId = ?`,
      [defaultHotelId]
    ) as [RowDataPacket[], any];

    const transformedStaff = (staff || []).map((row: RowDataPacket) => ({
      id: row.id,
      user: {
        id: row.userId,
        name: row.name,
        email: row.email
      }
    }));

    return (
      <TaskDashboardClient 
        hotels={hotels} 
        initialStats={taskStats} 
        staff={transformedStaff} 
      />
    );
  } catch (error) {
    console.error('Error fetching staff:', error);
    return (
      <TaskDashboardClient 
        hotels={hotels} 
        initialStats={taskStats} 
        staff={[]} 
      />
    );
  }
}