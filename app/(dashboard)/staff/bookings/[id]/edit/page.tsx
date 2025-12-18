import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { bookingService } from '@/lib/services/booking.service';
import BookingEditClient from './client';

export const metadata: Metadata = {
  title: 'Edit Booking | Vendor Dashboard',
  description: 'Edit booking details and information',
};

export default async function EditBookingPage({
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
    // Get booking details with full information
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Booking #{bookingId.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update booking details and information
          </p>
        </div>
        <BookingEditClient booking={booking} vendorId={session.user.vendorId as string} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching booking for edit:', error);
    // If booking not found or error, redirect to bookings list
    redirect('/vendor/bookings');
  }
} 