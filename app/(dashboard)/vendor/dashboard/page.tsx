import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserVendorId } from '@/lib/utils/vendor';
import pool from '@/lib/db';
import VendorDashboardClient from './client';

export default async function VendorDashboardPage() {
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

  return <VendorDashboardClient hotels={rows} vendorId={vendorId} />;
}