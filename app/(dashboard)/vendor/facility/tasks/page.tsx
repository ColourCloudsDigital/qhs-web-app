import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import TaskDashboardClient from '../components/TaskDashboardClient';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import SubscriptionRequired from '@/components/common/SubscriptionRequired'; 

export const metadata: Metadata = {
  title: 'Facility Management | Vendor Dashboard',
  description: 'Manage maintenance tasks, staff assignments, and facility operations',
};

async function getVendorHotels(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: {
      hotels: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return vendor?.hotels || [];
}

async function getTaskStats(hotelId: string) {
  // Get task counts by status
  const statusCounts = await prisma.facilityTask.groupBy({
    by: ['status'],
    where: { hotelId },
    _count: true,
  });

  // Get counts by priority
  const priorityCounts = await prisma.facilityTask.groupBy({
    by: ['priority'],
    where: { hotelId },
    _count: true,
  });

  // Get upcoming/overdue tasks
  const today = new Date();
  const overdueTasks = await prisma.facilityTask.count({
    where: {
      hotelId,
      dueDate: { lt: today },
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
  });

  // Get total tasks
  const totalTasks = await prisma.facilityTask.count({
    where: { hotelId },
  });

  return {
    statusCounts,
    priorityCounts,
    overdueTasks,
    totalTasks,
  };
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check module access
  const hasAccess = await canAccessModule(
    session.user.id,
    ModuleType.FACILITY_MANAGEMENT
  );

  if (!hasAccess) {
    return <SubscriptionRequired moduleType={ModuleType.FACILITY_MANAGEMENT} />;
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
  const staff = await prisma.staff.findMany({
    where: {
      hotelId: defaultHotelId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <TaskDashboardClient 
      hotels={hotels} 
      initialStats={taskStats} 
      staff={staff} 
    />
  );
}