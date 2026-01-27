import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@/lib/types/enums';
import VendorNotificationsClient from './client';

export const metadata: Metadata = {
  title: 'Notifications | Vendor Dashboard',
  description: 'View and manage your notifications',
};

export default async function VendorNotificationsPage() {
  // Get the authenticated session
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is a vendor
  if (!session || (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN)) {
    redirect('/login?callbackUrl=/vendor/notifications');
  }
  
  return <VendorNotificationsClient />;
}