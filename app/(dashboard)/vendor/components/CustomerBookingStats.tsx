'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ShieldCheck, 
  MapPin, 
  CreditCard,
  Zap
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CustomerBookingStats {
  totalBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  totalSpent: number;
  favoriteCity?: string;
  loyaltyPoints?: number;
}

interface CustomerBookingStatsProps {
  customerId: string;
}

export default function CustomerBookingStats({ customerId }: CustomerBookingStatsProps) {
  const [stats, setStats] = useState<CustomerBookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/customer/${customerId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching customer stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, [customerId]);
  
  // Sample data for development
  const sampleStats: CustomerBookingStats = {
    totalBookings: 5,
    activeBookings: 1,
    upcomingBookings: 2,
    totalSpent: 250000,
    favoriteCity: 'Lagos',
    loyaltyPoints: 450
  };
  
  // Use sample data while loading or if API fails
  const displayStats = stats || sampleStats;
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Bookings */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center">
          <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Stays</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                displayStats.totalBookings
              )}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Active/Upcoming Bookings */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center">
          <div className="rounded-md bg-green-100 p-2 dark:bg-green-900/30">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Stays</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                displayStats.upcomingBookings
              )}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Total Spent */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center">
          <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900/30">
            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                formatCurrency(displayStats.totalSpent)
              )}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Loyalty Points */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center">
          <div className="rounded-md bg-amber-100 p-2 dark:bg-amber-900/30">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loyalty Points</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                displayStats.loyaltyPoints || 0
              )}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}