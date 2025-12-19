'use client';

import { useEffect, useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  HotelIcon, 
  Users, 
  CreditCard, 
  Percent, 
  Calendar 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import RoomGrid from '@/components/vendor/dashboard/RoomGrid';
import QuickActions from '@/components/vendor/dashboard/QuickActions';
import MiniCalendar from '@/components/vendor/dashboard/MiniCalendar';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  totalRevenue: number;
  occupancyRate: number;
}

interface VendorDashboardClientProps {
  hotels: {
    id: string;
    name: string;
  }[];
  vendorId: string;
}

export default function VendorDashboardClient({ hotels, vendorId }: VendorDashboardClientProps) {
  const { currentHotel, loading } = useHotel();
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    totalBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    totalRevenue: 0,
    occupancyRate: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch hotel stats
  useEffect(() => {
    const fetchHotelStats = async () => {
      if (!currentHotel?.id) return;
      
      try {
        setDashboardLoading(true);
        setError(null);
        
        const response = await fetch(`/api/vendor/hotels/${currentHotel.id}/dashboard-stats`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setDashboardLoading(false);
      }
    };
    
    if (currentHotel?.id) {
      fetchHotelStats();
    } else {
      setDashboardLoading(false);
    }
  }, [currentHotel]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Additional logic to filter data based on the selected date
  };

  // Loading state
  if (loading || dashboardLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // No hotel selected
  if (!currentHotel) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <HotelIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">No Hotel Selected</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Please select a hotel to view its dashboard, or create a new hotel to get started.
        </p>
        <div className="mt-6">
          <Link href="/vendor/hotels">
            <Button className="mx-auto">View Your Hotels</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="warning" className="mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentHotel.name} Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview and real-time status of your hotel</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href={`/vendor/hotels/${currentHotel.id}`}>
            <Button variant="outline" size="sm">View Hotel Details</Button>
          </Link>
          <Link href="/vendor/bookings">
            <Button size="sm">Manage Bookings</Button>
          </Link>
          <Link href="/vendor/dashboard/walk-in">
            <Button variant="secondary" size="sm">Walk-in Booking</Button>
          </Link>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <QuickActions hotelId={currentHotel.id} hotels={hotels} vendorId={vendorId} />

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-4 h-12 w-12 rounded-full bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <HotelIcon className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.occupiedRooms}/{stats.totalRooms}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Occupied Rooms</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-4 h-12 w-12 rounded-full bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todayCheckIns}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">in</span>
              <span className="text-xl font-bold text-gray-400 dark:text-gray-500">/</span>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todayCheckOuts}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">out</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Today&apos;s Activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-4 h-12 w-12 rounded-full bg-yellow-100 p-3 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalBookings}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Total Bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-4 h-12 w-12 rounded-full bg-purple-100 p-3 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalRevenue)}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Total Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-4 h-12 w-12 rounded-full bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <Percent className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.occupancyRate}%
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Occupancy Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Room Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Rooms Status</CardTitle>
              <Link href={`/vendor/hotels/${currentHotel.id}/rooms`}>
                <Button variant="ghost" size="sm">View All Rooms</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <RoomGrid hotelId={currentHotel.id} />
            </CardContent>
          </Card>
        </div>

        {/* Calendar Widget */}
        <div className="lg:col-span-1">
          <MiniCalendar 
            hotelId={currentHotel.id} 
            onDateSelect={handleDateSelect}
          />
          
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Today&apos;s Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium text-gray-700 dark:text-gray-300">Check-ins</h4>
                  {stats.todayCheckIns > 0 ? (
                    <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        {stats.todayCheckIns} guests checking in today
                      </p>
                      <Link href={`/vendor/bookings?checkInDate=today&hotelId=${currentHotel.id}`}>
                        <p className="mt-1 text-xs text-green-600 hover:underline dark:text-green-400">
                          View check-in list →
                        </p>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No check-ins scheduled for today
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="mb-2 font-medium text-gray-700 dark:text-gray-300">Check-outs</h4>
                  {stats.todayCheckOuts > 0 ? (
                    <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {stats.todayCheckOuts} guests checking out today
                      </p>
                      <Link href={`/vendor/bookings?checkOutDate=today&hotelId=${currentHotel.id}`}>
                        <p className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                          View check-out list →
                        </p>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No check-outs scheduled for today
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 