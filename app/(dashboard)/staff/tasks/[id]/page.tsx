import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType, UserRole } from '@/lib/types/enums';
import StaffTaskDetailClient from '../../components/StaffTaskDetailClient';
import SubscriptionRequired from '@/components/common/SubscriptionRequired';
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

  if (session.user.role !== UserRole.STAFF) {
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

  return <StaffTaskDetailClient taskId={taskId} staffId={session.user.id} />;
}