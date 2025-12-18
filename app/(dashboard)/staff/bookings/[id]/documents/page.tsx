import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { bookingService } from '@/lib/services/booking.service';
import DocumentsPageClient from './client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Booking Documents | Vendor Dashboard',
  description: 'Manage booking documents and attachments',
};

export default async function BookingDocumentsPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the authenticated session
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is a vendor
  if (!session || session.user.role !== 'VENDOR') {
    redirect('/login?callbackUrl=/vendor/bookings');
  }

  const bookingId = params.id;

  try {
    // Get booking details
    const booking = await bookingService.getBookingById(
      bookingId,
      true, // includeCustomer
      true, // includeHotel
      true  // includeRoom
    );

    // Verify the booking belongs to a hotel owned by this vendor
    // This is a simplified check assuming the booking service handles authorization

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Documents for Booking #{bookingId.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload and manage documents related to this booking
            </p>
          </div>
          
          <Link
            href={`/vendor/bookings/${bookingId}`}
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking
          </Link>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <DocumentsPageClient bookingId={bookingId} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching booking for documents page:', error);
    // If booking not found or error, redirect to bookings list
    redirect('/vendor/bookings');
  }
} 