'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Calendar,
  Hotel,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter values
  const [selectedHotel, setSelectedHotel] = useState(searchParams.get('hotelId') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [checkInDate, setCheckInDate] = useState(searchParams.get('checkInDate') || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams.get('checkOutDate') || '');
  
  // Fetch hotels for the vendor
  useEffect(() => {
    async function fetchHotels() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/hotels?vendorId=${vendorId}&simple=true`);
        if (response.ok) {
          const data = await response.json();
          setHotels(data.hotels || []);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchHotels();
  }, [vendorId]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search parameter
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    // Reset to first page
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle filter form submission
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update filter parameters
    if (selectedHotel) {
      params.set('hotelId', selectedHotel);
    } else {
      params.delete('hotelId');
    }
    
    if (selectedStatus) {
      params.set('status', selectedStatus);
    } else {
      params.delete('status');
    }
    
    if (checkInDate) {
      params.set('checkInDate', checkInDate);
    } else {
      params.delete('checkInDate');
    }
    
    if (checkOutDate) {
      params.set('checkOutDate', checkOutDate);
    } else {
      params.delete('checkOutDate');
    }
    
    // Reset to first page
    params.set('page', '1');
    
    // Close filter panel
    setIsFilterOpen(false);
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedHotel('');
    setSelectedStatus('');
    setCheckInDate('');
    setCheckOutDate('');
    setSearchTerm('');
    
    router.push(pathname);
  };
  
  return (
    <div className="mb-8">
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Bookings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View and manage all bookings across your hotels
          </p>
        </div>
        
        <div className="mt-4 flex space-x-2 md:mt-0">
          <Link
            href="/vendor/bookings/calendar"
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </Link>
          
          <Link
            href="/vendor/bookings/new"
            className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        {/* Search Form */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search by name, email or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <button
              type="submit"
              className="absolute right-3 top-2 rounded-md bg-primary px-2 py-1 text-xs font-medium text-white"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Filter Button */}
        <div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {(selectedHotel || selectedStatus || checkInDate || checkOutDate) && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                Active
              </span>
            )}
          </button>
        </div>
        
        {/* Reset Button */}
        {(searchParams.toString() !== '') && (
          <div>
            <button
              onClick={resetFilters}
              className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </button>
          </div>
        )}
      </div>
      
      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleFilterSubmit}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Hotel Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hotel
                </label>
                <div className="relative">
                  <select
                    value={selectedHotel}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Hotels</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                  <Hotel className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
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
              
              {/* Check-in Date Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Check-out Date Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}