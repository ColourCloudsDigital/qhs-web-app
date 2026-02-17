import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import VendorProfileClient from './VendorProfileClient';

export const metadata: Metadata = {
  title: 'My Profile | Vendor Dashboard',
  description: 'Manage your vendor account and profile settings',
};

export default async function VendorProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login?callbackUrl=/vendor/profile');
  }
  
  if (session.user.role !== 'VENDOR') {
    redirect('/vendor/dashboard');
  }
  
  return <VendorProfileClient />;
}
