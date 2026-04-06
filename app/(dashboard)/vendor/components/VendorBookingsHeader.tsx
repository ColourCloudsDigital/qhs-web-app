'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, Calendar, Hotel, RefreshCw, PlusCircle, BedDouble } from 'lucide-react';

interface VendorBookingsHeaderProps {
  vendorId: string;
}

export default function VendorBookingsHeader({ vendorId }: VendorBookingsHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [roomUnits, setRoomUnits] = useState<{ id: string; roomNumber: string; roomName: string }[]>([]);

  // Filter state — initialised from URL
  const [selectedHotel, setSelectedHotel] = useState(searchParams.get('hotelId') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [checkInDate, setCheckInDate] = useState(searchParams.get('checkInDate') || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams.get('checkOutDate') || '');
  const [selectedRoomUnit, setSelectedRoomUnit] = useState(searchParams.get('roomUnitId') || '');

  const hasActiveFilters = !!(selectedHotel || selectedStatus || checkInDate || checkOutDate || selectedRoomUnit || searchParams.get('search'));

  // Fetch vendor hotels
  useEffect(() => {
    fetch(`/api/vendor/${vendorId}/hotels`)
      .then(r => r.ok ? r.json() : { hotels: [] })
      .then(d => setHotels(d.hotels || []))
      .catch(() => {});
  }, [vendorId]);

  // Fetch room units when a hotel is selected in the filter
  useEffect(() => {
    if (!selectedHotel) { setRoomUnits([]); return; }
    fetch(`/api/vendor/hotels/${selectedHotel}/rooms/status`)
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => setRoomUnits((d.rooms || []).map((u: any) => ({
        id: u.id,
        roomNumber: u.roomNumber,
        roomName: u.type || u.name || 'Room',
      }))))
      .catch(() => setRoomUnits([]));
  }, [selectedHotel]);

  // Sync filter state when URL changes (e.g. navigating from dashboard)
  useEffect(() => {
    setSelectedHotel(searchParams.get('hotelId') || '');
    setSelectedStatus(searchParams.get('status') || '');
    setCheckInDate(searchParams.get('checkInDate') || '');
    setCheckOutDate(searchParams.get('checkOutDate') || '');
    setSelectedRoomUnit(searchParams.get('roomUnitId') || '');
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) params.set('search', searchTerm); else params.delete('search');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    // Preserve search
    if (searchTerm) params.set('search', searchTerm);
    // Apply filter values
    if (selectedHotel) params.set('hotelId', selectedHotel);
    if (selectedStatus) params.set('status', selectedStatus);
    if (checkInDate) params.set('checkInDate', checkInDate);
    if (checkOutDate) params.set('checkOutDate', checkOutDate);
    if (selectedRoomUnit) params.set('roomUnitId', selectedRoomUnit);
    params.set('page', '1');
    setIsFilterOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    setSelectedHotel('');
    setSelectedStatus('');
    setCheckInDate('');
    setCheckOutDate('');
    setSelectedRoomUnit('');
    setSearchTerm('');
    router.push(pathname);
  };

  // Active room unit label
  const activeRoomUnit = roomUnits.find(u => u.id === selectedRoomUnit);
  const roomUnitLabel = activeRoomUnit
    ? `Room ${activeRoomUnit.roomNumber}`
    : selectedRoomUnit ? `Unit …${selectedRoomUnit.slice(-6)}` : '';

  return (
    <div className="mb-8">
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Bookings</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">View and manage all bookings across your hotels</p>
        </div>
        <div className="mt-4 flex space-x-2 md:mt-0">
          <Link href="/vendor/bookings/calendar" className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            <Calendar className="mr-2 h-4 w-4" />Calendar View
          </Link>
          <Link href="/vendor/bookings/new" className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark">
            <PlusCircle className="mr-2 h-4 w-4" />New Booking
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        {/* Search */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search by name, email or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <button type="submit" className="absolute right-3 top-2 rounded-md bg-primary px-2 py-1 text-xs font-medium text-white">
              Search
            </button>
          </form>
        </div>

        {/* Filter button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">Active</span>
          )}
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />Reset
          </button>
        )}
      </div>

      {/* Active room unit chip */}
      {selectedRoomUnit && (
        <div className="mt-3 flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtered by:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {roomUnitLabel}
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('roomUnitId');
                params.set('page', '1');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="ml-1 hover:text-red-500"
            >×</button>
          </span>
        </div>
      )}

      {/* Filter panel */}
      {isFilterOpen && (
        <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleFilterSubmit}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Hotel */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Hotel</label>
                <div className="relative">
                  <select
                    value={selectedHotel}
                    onChange={(e) => { setSelectedHotel(e.target.value); setSelectedRoomUnit(''); }}
                    className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Hotels</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <Hotel className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Room Unit — only shown when a hotel is selected */}
              {selectedHotel && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Unit</label>
                  <div className="relative">
                    <select
                      value={selectedRoomUnit}
                      onChange={(e) => setSelectedRoomUnit(e.target.value)}
                      className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Rooms</option>
                      {roomUnits.map(u => (
                        <option key={u.id} value={u.id}>Room {u.roomNumber} ({u.roomName})</option>
                      ))}
                    </select>
                    <BedDouble className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              {/* Check-in */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Check-in Date</label>
                <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>

              {/* Check-out */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Check-out Date</label>
                <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsFilterOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
