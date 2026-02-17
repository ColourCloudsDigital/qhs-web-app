import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import SubscriptionRequired from '@/components/common/SubscriptionRequired';
import { RowDataPacket } from 'mysql2';
import { ModuleType } from '@/lib/types/enums';
import FacilityDashboardClient from './components/FacilityDashboardClient';
import { Hotel } from '@/models/hotel';

export const metadata: Metadata = {
  title: 'Facility Management Dashboard | Vendor',
  description: 'Comprehensive facility management dashboard for vendors',
};

async function getVendorData(userId: string) {
  try {
    // Get vendor info and hotels
    const [vendorResult] = await pool.query(
      `SELECT v.id, v.subscriptionPlanId, v.subscriptionStatus
       FROM vendors v WHERE v.userId = ?`,
      [userId]
    ) as [RowDataPacket[], any];

    if (!vendorResult || vendorResult.length === 0) {
      return null;
    }

    const vendor = vendorResult[0];

    // Get vendor hotels
    const [hotels] = await pool.query(
      `SELECT h.id, h.name, h.address, h.city, h.state
       FROM hotels h
       WHERE h.vendorId = ?`,
      [vendor.id]
    ) as [RowDataPacket[], any];

    return {
      vendor,
      hotels: hotels as Hotel[] || []
    };
  } catch (error) {
    console.error('Error fetching vendor data:', error);
    return null;
  }
}

async function getFacilityStats(vendorId: string) {
  try {
    // Get total staff across all hotels
    const [staffStats] = await pool.query(
      `SELECT COUNT(*) as totalStaff,
       COUNT(CASE WHEN u.isActive = 1 THEN 1 END) as activeStaff
       FROM staff s
       JOIN users u ON s.userId = u.id
       JOIN hotels h ON s.hotelId = h.id
       WHERE h.vendorId = ?`,
      [vendorId]
    ) as [RowDataPacket[], any];

    // Get task stats across all hotels
    const [taskStats] = await pool.query(
      `SELECT COUNT(*) as totalTasks,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendingTasks,
       COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as inProgressTasks,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedTasks,
       COUNT(CASE WHEN due_date < CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 END) as overdueTasks
       FROM facility_tasks ft
       JOIN hotels h ON ft.hotelId = h.id
       WHERE h.vendorId = ?`,
      [vendorId]
    ) as [RowDataPacket[], any];

    // Get recent tasks
    const [recentTasks] = await pool.query(
      `SELECT ft.taskId as id, ft.title, ft.status, ft.priority, ft.due_date,
       h.name as hotelName, s.position as staffPosition, u.name as staffName
       FROM facility_tasks ft
       JOIN hotels h ON ft.hotelId = h.id
       LEFT JOIN staff s ON ft.staffId = s.id
       LEFT JOIN users u ON s.userId = u.id
       WHERE h.vendorId = ?
       ORDER BY ft.created_at DESC
       LIMIT 10`,
      [vendorId]
    ) as [RowDataPacket[], any];

    return {
      staff: staffStats[0] as { totalStaff: number; activeStaff: number } || { totalStaff: 0, activeStaff: 0 },
      tasks: taskStats[0] as { totalTasks: number; pendingTasks: number; inProgressTasks: number; completedTasks: number; overdueTasks: number } || { totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, overdueTasks: 0 },
      recentTasks: recentTasks as any[] || []
    };
  } catch (error) {
    console.error('Error fetching facility stats:', error);
    return {
      staff: { totalStaff: 0, activeStaff: 0 },
      tasks: { totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, overdueTasks: 0 },
      recentTasks: []
    };
  }
}

export default async function FacilityManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const vendorData = await getVendorData(session.user.id);

  if (!vendorData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Facility Management</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p>Vendor not found.</p>
        </div>
      </div>
    );
  }

  // Check subscription
  const hasSubscription = vendorData.vendor.subscriptionPlanId && 
    vendorData.vendor.subscriptionStatus?.toLowerCase() === 'active';

  if (!hasSubscription) {
    return <SubscriptionRequired moduleType={ModuleType.FACILITY_MANAGEMENT} />;
  }

  if (vendorData.hotels.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Facility Management</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p>You need to add a hotel before you can use the facility management features.</p>
        </div>
      </div>
    );
  }

  const facilityStats = await getFacilityStats(vendorData.vendor.id);

  return (
    <FacilityDashboardClient 
      hotels={vendorData.hotels}
      stats={facilityStats}
    />
  );
} 