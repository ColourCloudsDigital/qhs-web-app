'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types/enums';
import { getDashboardPath } from '@/lib/dashboard-utils';
import { useBookingStore } from '@/lib/hooks/useBookingContext';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Users, Hotel } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const recentBookings = useBookingStore((state) => state.recentBookings);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const userRole = session.user.role as UserRole;
      const redirectPath = getDashboardPath(userRole);
      if (redirectPath && redirectPath !== '/') {
        router.push(redirectPath);
      } else if (redirectPath === '/') {
        console.warn(`DashboardPage: Role '${userRole}' resulted in default redirect path '/'. User might be stuck in a loop if '/' redirects back to '/dashboard'.`);
        router.push('/');
      }
    } else if (status === 'authenticated' && !session?.user?.role) {
      console.warn('DashboardPage: Authenticated, but user role not yet available in session.');
    }
  }, [status, session, router]);

  return (
    <div className="space-y-8">
      {/* Recent Bookings Section */}
      {recentBookings.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Recent Bookings</h2>
          
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{booking.roomName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{booking.hotelName}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatCurrency(booking.price)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(booking.bookedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {status === 'loading' && (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}