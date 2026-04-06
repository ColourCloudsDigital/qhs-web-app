'use client';

import { useEffect, useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HotelIcon, 
  Users, 
  CreditCard, 
  Percent, 
  Calendar,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
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
  hotels: { id: string; name: string }[];
  vendorId: string;
}

export default function VendorDashboardClient({ hotels, vendorId }: VendorDashboardClientProps) {
  const { currentHotel, loading } = useHotel();
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0, occupiedRooms: 0, totalBookings: 0,
    todayCheckIns: 0, todayCheckOuts: 0, totalRevenue: 0, occupancyRate: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Selected room state
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; roomId: string; roomNumber: string } | null>(null);
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [roomBookingsLoading, setRoomBookingsLoading] = useState(false);

  // Fetch hotel stats
  useEffect(() => {
    const fetchHotelStats = async () => {
      if (!currentHotel?.id) return;
      try {
        setDashboardLoading(true);
        setError(null);
        const response = await fetch(`/api/vendor/hotels/${currentHotel.id}/dashboard-stats`);
        if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setDashboardLoading(false);
      }
    };
    if (currentHotel?.id) fetchHotelStats();
    else setDashboardLoading(false);
  }, [currentHotel]);

  // Fetch bookings for selected room unit
  useEffect(() => {
    if (!selectedRoom) { setRoomBookings([]); return; }
    const fetchRoomBookings = async () => {
      setRoomBookingsLoading(true);
      try {
        // Use unit id (room_units.id) — bookings are linked via roomUnitId
        const res = await fetch(`/api/vendor/rooms/${selectedRoom.id}/bookings`);
        if (res.ok) {
          const data = await res.json();
          setRoomBookings(data.bookings || []);
        }
      } catch { setRoomBookings([]); }
      finally { setRoomBookingsLoading(false); }
    };
    fetchRoomBookings();
  }, [selectedRoom]);

  const handleRoomSelect = (unitId: string, roomNumber: string, roomId: string) => {
    setSelectedRoom(prev =>
      prev?.id === unitId ? null : { id: unitId, roomId, roomNumber }
    );
  };

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

  if (!currentHotel) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <HotelIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">No Hotel Selected</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Please select a hotel to view its dashboard, or create a new hotel to get started.
        </p>
        <div className="mt-6">
          <Link href="/vendor/hotels"><Button className="mx-auto">View Your Hotels</Button></Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="warning" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>;
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
        </div>
      </div>

      <QuickActions hotelId={currentHotel.id} hotels={hotels} vendorId={vendorId} />

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: <HotelIcon className="h-6 w-6" />, color: 'blue', value: `${stats.occupiedRooms}/${stats.totalRooms}`, label: 'Occupied Rooms' },
          { icon: <Calendar className="h-6 w-6" />, color: 'green', value: `${stats.todayCheckIns} / ${stats.todayCheckOuts}`, label: "Today's Activity" },
          { icon: <Users className="h-6 w-6" />, color: 'yellow', value: stats.totalBookings, label: 'Total Bookings' },
          { icon: <CreditCard className="h-6 w-6" />, color: 'purple', value: formatCurrency(stats.totalRevenue), label: 'Total Revenue' },
          { icon: <Percent className="h-6 w-6" />, color: 'red', value: `${stats.occupancyRate}%`, label: 'Occupancy Rate' },
        ].map(({ icon, color, value, label }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className={`mb-4 h-12 w-12 rounded-full bg-${color}-100 p-3 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                {icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
              <p className="text-gray-500 dark:text-gray-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Room Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-medium">Rooms Status</CardTitle>
                {selectedRoom && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary">
                    Room {selectedRoom.roomNumber} selected
                    <button onClick={() => setSelectedRoom(null)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
              <Link href={`/vendor/hotels/${currentHotel.id}/rooms`}>
                <Button variant="ghost" size="sm">View All Rooms</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <RoomGrid
                hotelId={currentHotel.id}
                onRoomSelect={handleRoomSelect}
                selectedRoomId={selectedRoom?.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Calendar + Activity */}
        <div className="lg:col-span-1 space-y-6">
          <MiniCalendar
            hotelId={currentHotel.id}
            onDateSelect={setSelectedDate}
            roomUnitId={selectedRoom?.id}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                {selectedRoom ? `Room ${selectedRoom.roomNumber} Activity` : "Today's Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoom ? (
                roomBookingsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : roomBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No bookings for this room.</p>
                ) : (
                  <div className="space-y-3">
                    {roomBookings.slice(0, 5).map((b: any) => (
                      <div key={b.id} className="rounded-md border border-gray-100 p-3 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {b.guestName || b.customer?.name || 'Guest'}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            b.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{b.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium text-gray-700 dark:text-gray-300">Check-ins</h4>
                    {stats.todayCheckIns > 0 ? (
                      <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          {stats.todayCheckIns} guests checking in today
                        </p>
                        <Link href={`/vendor/bookings?checkInDate=today&hotelId=${currentHotel.id}`}>
                          <p className="mt-1 text-xs text-green-600 hover:underline dark:text-green-400">View check-in list →</p>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No check-ins today</p>
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
                          <p className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400">View check-out list →</p>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No check-outs today</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
