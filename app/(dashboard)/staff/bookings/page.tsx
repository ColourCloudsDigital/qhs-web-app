import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import StaffBookingsClient from '../components/StaffBookingsClient';

export const metadata: Metadata = {
  title: 'Bookings | Staff Dashboard',
  description: 'View and manage hotel bookings and reservations.',
};

export default async function StaffBookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is staff
  if (!session || session.user.role !== UserRole.STAFF) {
    redirect('/login?callbackUrl=/staff/bookings');
  }

  // Extract query parameters for filtering and pagination
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;
  const status = searchParams.status as string | undefined;
  const search = searchParams.search as string | undefined;
  const checkInDate = searchParams.checkInDate as string | undefined;
  const checkOutDate = searchParams.checkOutDate as string | undefined;
  const sortBy = searchParams.sortBy as string | undefined || 'createdAt';
  const sortOrder = searchParams.sortOrder as 'asc' | 'desc' | undefined || 'desc';

  return (
    <StaffBookingsClient 
      staffId={session.user.id}
      page={page}
      limit={limit}
      status={status}
      search={search}
      checkInDate={checkInDate ? new Date(checkInDate) : undefined}
      checkOutDate={checkOutDate ? new Date(checkOutDate) : undefined}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}