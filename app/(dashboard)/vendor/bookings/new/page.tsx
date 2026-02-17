import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import NewBookingForm from '../../components/NewBookingForm';
import pool from '@/lib/db';

export const metadata: Metadata = {
  title: 'Create New Booking | Vendor Dashboard',
  description: 'Create a new booking in the vendor dashboard',
};

export default async function NewBookingPage() {
  // Get the authenticated session
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is a vendor
  if (!session || (session.user.role !== 'VENDOR' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login?callbackUrl=/vendor/bookings/new');
  }
  
  // Get vendor ID
  const vendorId = session.user.vendorId || '';
  
  // Fetch hotels for this vendor
  let hotels = [];
  try {
    let query;
    let queryParams = [];
    
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all hotels
      query = `SELECT id, name FROM hotels ORDER BY name ASC`;
    } else {
      // Vendor can only see their hotels
      query = `SELECT id, name FROM hotels WHERE vendorId = ? ORDER BY name ASC`;
      queryParams.push(vendorId);
    }
    
    const [hotelsResult] = await pool.query(query, queryParams);
    hotels = hotelsResult as any[];
  } catch (error) {
    console.error('Error fetching hotels:', error);
  }
  
  // If no hotels are available, redirect to hotels page
  if (hotels.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Booking</h1>
        </div>
        
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
          <h2 className="text-lg font-medium">No Hotels Available</h2>
          <p className="mt-1">You need to create a hotel before you can add bookings.</p>
          <a href="/vendor/hotels/new" className="mt-4 inline-block rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600">
            Create Hotel
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Booking</h1>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <NewBookingForm hotels={hotels} vendorId={vendorId} />
      </div>
    </div>
  );
} 