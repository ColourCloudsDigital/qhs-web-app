'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Calendar,
  Users,
  Building,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from '@/lib/toast';

interface ExpiredBooking {
  id: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  hotelName: string;
  roomName: string;
  firstName: string;
  lastName: string;
  roomUnitsCount: number;
}

interface CheckoutStats {
  expiredCount: number;
  expiredBookings: ExpiredBooking[];
  roomUnitsToFree: number;
}

export default function AutomatedCheckoutPanel() {
  const [stats, setStats] = useState<CheckoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch expired bookings stats
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings/automated-checkout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch expired bookings stats');
    } finally {
      setIsLoading(false);
    }
  };

  // Process expired bookings
  const processExpiredBookings = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/bookings/automated-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process expired bookings');
      }

      const data = await response.json();
      
      toast.success(
        `Successfully processed ${data.result.processedBookings} bookings and freed ${data.result.freedRoomUnits} room units`,
        {
          title: 'Automated Checkout Complete'
        }
      );

      if (data.result.errors.length > 0) {
        toast.error(
          `${data.result.errors.length} errors occurred during processing`,
          {
            title: 'Some Issues Encountered'
          }
        );
      }

      // Refresh stats after processing
      await fetchStats();
    } catch (error) {
      console.error('Error processing expired bookings:', error);
      toast.error('Failed to process expired bookings');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual checkout specific booking
  const checkoutSpecificBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to checkout booking');
      }

      toast.success('Booking checked out successfully');
      
      // Refresh stats after checkout
      await fetchStats();
    } catch (error) {
      console.error('Error checking out booking:', error);
      toast.error('Failed to checkout booking');
    }
  };

  // Load stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Automated Checkout
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor and process expired bookings
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {stats && stats.expiredCount > 0 && (
            <button
              onClick={processExpiredBookings}
              disabled={isProcessing}
              className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Process All
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  Expired Bookings
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {stats.expiredCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Room Units to Free
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {stats.roomUnitsToFree}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                  Last Updated
                </p>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  {lastUpdated ? formatDate(lastUpdated.toISOString()) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expired Bookings List */}
      {stats && stats.expiredBookings.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Expired Bookings ({stats.expiredBookings.length})
          </h3>
          
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Hotel & Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Checkout Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {stats.expiredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {booking.firstName} {booking.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {booking.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {booking.hotelName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.roomName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(booking.checkOutDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          booking.status === 'CHECKED_IN' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {booking.roomUnitsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => checkoutSpecificBooking(booking.id)}
                          className="flex items-center text-primary hover:text-primary-dark"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Checkout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : stats && stats.expiredBookings.length === 0 ? (
        <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-lg font-medium text-green-800 dark:text-green-400">
            All Clear!
          </h3>
          <p className="mt-1 text-sm text-green-600 dark:text-green-300">
            No expired bookings found. All room units are properly managed.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      )}
    </div>
  );
}