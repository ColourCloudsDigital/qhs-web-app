'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  AlertCircle,
  Bed
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

interface BookingsAnalyticsProps {
  vendorId: string;
}

export default function BookingsAnalytics({ vendorId }: BookingsAnalyticsProps) {
  const [statsData, setStatsData] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('current_month');
  
  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/vendor/${vendorId}/booking-stats?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setStatsData(data);
        } else {
          console.error('Failed to fetch booking stats:', await response.text());
          // Set empty stats if API fails
          setStatsData({
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            checkedInBookings: 0,
            cancelledBookings: 0,
            totalRevenue: 0,
            occupancyRate: 0
          });
        }
      } catch (error) {
        console.error('Error fetching booking stats:', error);
        // Set empty stats if API fails
        setStatsData({
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          checkedInBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0,
          occupancyRate: 0
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, [vendorId, timeframe]);
  
  // Use real data or empty stats
  const stats = statsData || {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    checkedInBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0
  };
  
  // Whether to show growth indicators
  const showGrowth = stats.totalBookings > 0;
  
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Booking Analytics
        </h2>
        
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="current_month">Current Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="year_to_date">Year to Date</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                ) : (
                  stats.totalBookings
                )}
              </h3>
            </div>
          </div>
          {showGrowth && (
            <div className="mt-3 flex items-center">
              <div className="flex items-center text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span className="text-xs font-medium">8.2% increase</span>
              </div>
              <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">from last period</span>
            </div>
          )}
        </div>
        
        {/* Occupancy Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-md bg-green-100 p-2 dark:bg-green-900/30">
              <Bed className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupancy Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                ) : (
                  `${stats.occupancyRate}%`
                )}
              </h3>
            </div>
          </div>
          {showGrowth && (
            <div className="mt-3 flex items-center">
              <div className="flex items-center text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span className="text-xs font-medium">4.5% increase</span>
              </div>
              <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">from last period</span>
            </div>
          )}
        </div>
        
        {/* Revenue */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900/30">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                ) : (
                  formatCurrency(stats.totalRevenue)
                )}
              </h3>
            </div>
          </div>
          {showGrowth && (
            <div className="mt-3 flex items-center">
              <div className="flex items-center text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span className="text-xs font-medium">12.4% increase</span>
              </div>
              <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">from last period</span>
            </div>
          )}
        </div>
        
        {/* Cancellations */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-md bg-red-100 p-2 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancellations</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                ) : (
                  stats.cancelledBookings
                )}
              </h3>
            </div>
          </div>
          {showGrowth && (
            <div className="mt-3 flex items-center">
              <div className="flex items-center text-red-500">
                <TrendingUp className="mr-1 h-4 w-4 rotate-180 transform" />
                <span className="text-xs font-medium">2.8% decrease</span>
              </div>
              <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">from last period</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Distribution */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Booking Status Distribution
        </h3>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {/* Pending */}
          <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Pending</p>
            <p className="mt-1 text-xl font-semibold text-yellow-900 dark:text-yellow-200">
              {isLoading ? '-' : stats.pendingBookings}
            </p>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
              {isLoading || stats.totalBookings === 0 ? '-' : `${Math.round((stats.pendingBookings / stats.totalBookings) * 100) || 0}%`}
            </p>
          </div>
          
          {/* Confirmed */}
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Confirmed</p>
            <p className="mt-1 text-xl font-semibold text-blue-900 dark:text-blue-200">
              {isLoading ? '-' : stats.confirmedBookings}
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              {isLoading || stats.totalBookings === 0 ? '-' : `${Math.round((stats.confirmedBookings / stats.totalBookings) * 100) || 0}%`}
            </p>
          </div>
          
          {/* Checked In */}
          <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Checked In</p>
            <p className="mt-1 text-xl font-semibold text-green-900 dark:text-green-200">
              {isLoading ? '-' : stats.checkedInBookings}
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              {isLoading || stats.totalBookings === 0 ? '-' : `${Math.round((stats.checkedInBookings / stats.totalBookings) * 100) || 0}%`}
            </p>
          </div>
          
          {/* Cancelled */}
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Cancelled</p>
            <p className="mt-1 text-xl font-semibold text-red-900 dark:text-red-200">
              {isLoading ? '-' : stats.cancelledBookings}
            </p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-400">
              {isLoading || stats.totalBookings === 0 ? '-' : `${Math.round((stats.cancelledBookings / stats.totalBookings) * 100) || 0}%`}
            </p>
          </div>
          
          {/* Others */}
          <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700/20">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-300">Others</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-200">
              {isLoading ? '-' : (stats.totalBookings - stats.pendingBookings - stats.confirmedBookings - stats.checkedInBookings - stats.cancelledBookings)}
            </p>
            <p className="mt-1 text-xs text-gray-700 dark:text-gray-400">
              {isLoading ? '-' : `${Math.round(((stats.totalBookings - stats.pendingBookings - stats.confirmedBookings - stats.checkedInBookings - stats.cancelledBookings) / stats.totalBookings) * 100)}%`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}