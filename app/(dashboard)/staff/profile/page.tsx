import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import StaffProfileClient from '../components/StaffProfileClient';

export const metadata: Metadata = {
  title: 'My Profile | Qaras Hotels Staff',
  description: 'View and manage your staff profile information and permissions.',
};

export default async function StaffProfilePage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is staff
  if (!session || session.user.role !== UserRole.STAFF) {
    redirect('/login?callbackUrl=/staff/profile');
  }

  return (
    <StaffProfileClient 
      userId={session.user.id} 
      staffId={session.user.staffId || ''} 
      userName={session.user.name || 'Staff Member'} 
      userEmail={session.user.email || ''}
    />
  );
}