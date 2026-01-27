import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import StaffDashboardClient from '../components/StaffDashboardClient';

export const metadata: Metadata = {
  title: 'Staff Dashboard | Qaras Hotels',
  description: 'Staff dashboard for managing tasks and bookings.',
};

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is staff
  if (!session || session.user.role !== UserRole.STAFF) {
    redirect('/login?callbackUrl=/staff/dashboard');
  }

  return <StaffDashboardClient staffId={session.user.id} staffName={session.user.name || 'Staff Member'} />;
}