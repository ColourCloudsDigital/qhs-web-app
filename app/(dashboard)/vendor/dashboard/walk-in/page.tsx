import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserVendorId } from '@/lib/utils/vendor';
import pool from '@/lib/db';
import WalkInBookingClient from '../../components/WalkInBookingClient';

export const metadata: Metadata = {
  title: 'Walk-in Booking | Vendor Dashboard',
  description: 'Create a new walk-in booking',
};

export default async function WalkInBookingPage() {
  // Get the authenticated session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  // Get vendor id
  const { vendorId } = await getUserVendorId(session);
  if (!vendorId) {
    redirect('/login');
  }

  // Fetch hotels for the vendor
  const [rows]: any = await pool.query(
    `SELECT id, name FROM hotels WHERE vendorId = ? AND isActive = 1 ORDER BY name ASC`,
    [vendorId]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Walk-in Booking</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage walk-in bookings for your hotels</p>
      </div>

      <WalkInBookingClient hotels={rows} vendorId={vendorId} />
    </div>
  );
} 