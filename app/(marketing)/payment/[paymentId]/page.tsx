import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { bookingService } from '@/lib/services/booking.service';
import PaymentClient from './client';

interface PageProps {
  params: {
    paymentId: string;
  };
}

export const metadata: Metadata = {
  title: 'Complete Payment | Qaras Hotels',
  description: 'Complete your payment for your hotel booking.',
};

export default async function PaymentPage({ params }: PageProps) {
  const bookingId = params.paymentId;
  
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return redirect(`/login?redirectTo=/payment/${bookingId}`);
  }
  
  try {
    // Get booking details with full information
    const booking = await bookingService.getBookingById(
      bookingId,
      true, // includeCustomer
      true, // includeHotel
      true  // includeRoom
    );
    
    // Verify the booking belongs to the current user
    if (session.user.role === 'CUSTOMER' && booking.customerId !== session.user.customerId) {
      return redirect('/dashboard');
    }
    
    // Redirect if booking is already paid
    if (booking.paymentStatus === 'PAID') {
      return redirect(`/bookings/${bookingId}/confirmation`);
    }
    
    return <PaymentClient booking={booking} />;
  } catch (error) {
    // If booking not found or error, redirect to dashboard
    return redirect('/dashboard');
  }
}