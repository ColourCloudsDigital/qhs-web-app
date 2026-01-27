import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import StaffBookingDetailClient from '../../components/StaffBookingDetailClient';

interface StaffBookingDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Booking Details | Staff Dashboard',
  description: 'View booking details',
};

export default async function StaffBookingDetailPage({ params }: StaffBookingDetailPageProps) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is staff
  if (!session || session.user.role !== UserRole.STAFF) {
    redirect('/login?callbackUrl=/staff/bookings/' + params.id);
  }

  return <StaffBookingDetailClient bookingId={params.id} staffId={session.user.id} />;
}