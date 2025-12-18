import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import BookingsList from '../components/BookingsList'; 
import VendorBookingsHeader from '../components/VendorBookingsHeader';
import BookingsAnalytics from '../components/BookingsAnalytics';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export const metadata: Metadata = {
  title: 'Manage Bookings | Vendor Dashboard',
  description: 'Manage your hotel bookings and reservations.',
};

export default async function VendorBookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get the authenticated session
  const session = await getServerSession(authOptions);
  
  // Check for impersonation
  const cookieStore = cookies();
  const isImpersonating = cookieStore.has('impersonation_token');

  // Check if user is authenticated and is a vendor or an admin impersonating a vendor
  if (!session || (session.user.role !== 'VENDOR' && !(session.user.role === 'SUPER_ADMIN' && isImpersonating))) {
    redirect('/login?callbackUrl=/vendor/bookings');
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
  const hotelId = searchParams.hotelId as string | undefined;
  
  // Determine the vendorId - if impersonating, get it from the impersonation token
  let vendorId = session.user.vendorId as string;
  
  // If vendorId is not available in the session (for super admin), we need to get it
  if (!vendorId && session.user.role === 'SUPER_ADMIN' && isImpersonating) {
    try {
      // For impersonation, we'll try to get the first vendor from the system
      // This is a simplified approach for the impersonation scenario
      const [rows]: any = await pool.query(`SELECT id FROM vendors LIMIT 1`);
      if (rows.length > 0) {
        vendorId = rows[0].id;
        console.log('Using vendorId for impersonation:', vendorId);
      }
    } catch (error) {
      console.error('Error fetching vendorId for impersonation:', error);
    }
  }
  
  if (!vendorId) {
    console.warn('No vendorId found, redirecting to login');
    redirect('/login?callbackUrl=/vendor/bookings');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <VendorBookingsHeader vendorId={vendorId} />
      
      <div className="mb-8">
        <BookingsAnalytics vendorId={vendorId} />
      </div>
      
      <BookingsList 
        vendorId={vendorId}
        page={page}
        limit={limit}
        status={status}
        search={search}
        checkInDate={checkInDate ? new Date(checkInDate) : undefined}
        checkOutDate={checkOutDate ? new Date(checkOutDate) : undefined}
        sortBy={sortBy}
        sortOrder={sortOrder}
        hotelId={hotelId}
      />
    </div>
  );
}