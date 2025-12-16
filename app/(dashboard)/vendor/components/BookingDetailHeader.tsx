import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';

interface BookingDetailHeaderProps {
  booking: any;
}

export default function BookingDetailHeader({ booking }: BookingDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-4">
        <Link 
          href="/vendor/bookings" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Bookings
        </Link>
      </div>
      
      <div className="flex flex-col items-start justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {booking.hotel.name} • {booking.room.name}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge status={booking.status} size="lg" />
          <PaymentStatusBadge status={booking.paymentStatus} size="lg" />
        </div>
      </div>
    </div>
  );
}