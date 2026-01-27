import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import StaffTasksClient from '../components/StaffTasksClient';

export const metadata: Metadata = {
  title: 'My Tasks | Staff Dashboard',
  description: 'View and manage your assigned tasks.',
};

export default async function StaffTasksPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is staff
  if (!session || session.user.role !== UserRole.STAFF) {
    redirect('/login?callbackUrl=/staff/tasks');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your assigned tasks and responsibilities.
        </p>
      </div>

      {/* Tasks Client Component */}
      <StaffTasksClient staffId={session.user.id} />
    </div>
  );
}