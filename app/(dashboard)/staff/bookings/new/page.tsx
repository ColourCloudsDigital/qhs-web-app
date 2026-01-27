import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import StaffNewBookingForm from '../../components/StaffNewBookingForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Booking | Staff Dashboard',
  description: 'Create a new booking',
};

export default async function StaffNewBookingPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is staff
  if (!session || session.user.role !== UserRole.STAFF) {
    redirect('/login?callbackUrl=/staff/bookings/new');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Booking</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new hotel booking.
            </p>
          </div>
          <Link
            href="/staff/bookings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Link>
        </div>
      </div>

      {/* Booking Form */}
      <StaffNewBookingForm staffId={session.user.id} />
    </div>
  );
}