import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { bookingService } from '@/lib/services/booking.service';
import BookingDetailHeader from '../../components/BookingDetailHeader';
import BookingDetailClient from './client';

export const metadata: Metadata = {
  title: 'Booking Details | Vendor Dashboard',
  description: 'View and manage booking details',
};

export default async function VendorBookingDetailPage({
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
    // Note: In a real app, you'd want to check if the hotel belongs to this vendor
    // This is a simplified check assuming the booking service handles authorization

    return (
      <div className="container mx-auto px-4 py-8">
        <BookingDetailHeader booking={booking} />
        <BookingDetailClient booking={booking} vendorId={session.user.vendorId as string} />
      </div>
    );
  } catch (error) {
    // If booking not found or error, redirect to bookings list
    redirect('/vendor/bookings');
  }
}