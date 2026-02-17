import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import CustomerBookingStats from '../../vendor/components/CustomerBookingStats';
import CustomerBookingsList from '../../vendor/components/CustomerBookingsList';
import CustomerBookingsHeader from '../../vendor/components/CustomerBookingsHeader';

export const metadata: Metadata = {
  title: 'My Bookings | Customer Dashboard',
  description: 'View and manage your hotel bookings.',
};

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get the authenticated session
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is a customer
  if (!session || session.user.role !== 'CUSTOMER') {
    redirect('/login?callbackUrl=/customer/bookings');
  }

  // Extract query parameters for filtering and pagination
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;
  const status = searchParams.status as string | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <CustomerBookingsHeader />
      
      <div className="mb-8">
        <CustomerBookingStats customerId={session.user.customerId as string} />
      </div>
      
      <CustomerBookingsList 
        customerId={session.user.customerId as string}
        page={page}
        limit={limit}
        status={status}
      />
    </div>
  );
}