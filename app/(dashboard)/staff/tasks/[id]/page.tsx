import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import StaffTaskDetailClient from '../../components/StaffTaskDetailClient';
import SubscriptionRequired from '@/components/common/SubscriptionRequired';
import TaskService from '@/lib/services/task.service';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
  title: 'Task Details | Staff Dashboard',
  description: 'View and update task details',
};

export default async function StaffTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const taskId = params.id;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'STAFF') {
    redirect('/dashboard');
  }

  // Check module access
  const hasAccess = await canAccessModule(
    session.user.id,
    ModuleType.FACILITY_MANAGEMENT
  );

  if (!hasAccess) {
    return <SubscriptionRequired moduleType={ModuleType.FACILITY_MANAGEMENT} />;
  }

  // Get staff info
  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!staff) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Task Details</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p>Your staff profile could not be found. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  // Get task details
  const task = await TaskService.getTaskById(taskId);

  if (!task) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Task Details</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p>The requested task could not be found.</p>
        </div>
      </div>
    );
  }

  // Check if the task is assigned to this staff member
  if (task.assignedToId !== staff.id) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Task Details</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p>You do not have permission to view this task.</p>
        </div>
      </div>
    );
  }

  return <StaffTaskDetailClient task={task} staffId={staff.id} />;
}