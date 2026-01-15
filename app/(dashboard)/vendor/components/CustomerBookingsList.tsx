'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Bed,
  Eye,
  Hotel
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import BookingStatusBadge from '../../vendor/components/BookingStatusBadge';

interface CustomerBookingsListProps {
  customerId: string;
  page: number;
  limit: number;
  status?: string;
}

export default function CustomerBookingsList({
  customerId,
  page = 1,
  limit = 10,
  status
}: CustomerBookingsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch bookings for this customer
  useEffect(() => {
    let isMounted = true;

    async function fetchBookings() {
      if (!isMounted) return;
      setIsLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());

      if (status) {
        queryParams.set('status', status);
      }

      try {
        const response = await fetch(`/api/customer/${customerId}/bookings?${queryParams.toString()}`);

        if (response.ok) {
          const data = await response.json();
          if (!isMounted) return;
          setBookings(data.data);
          setTotalPages(data.meta.totalPages);
          setTotalItems(data.meta.totalItems);
        } else {
          console.error('Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchBookings();

    // Subscribe to booking updates via BroadcastChannel with localStorage fallback
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('bookings');
      bc.addEventListener('message', () => {
        fetchBookings();
      });
    } catch (e) {
      // ignore
    }

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'bookings-updated') {
        fetchBookings();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      isMounted = false;
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [customerId, page, limit, status]);
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle status filter change
  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    
    params.set('page', '1'); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Use only real data; when loading, show skeletons; when empty, show empty state
  const displayBookings = bookings;

  const getStayProgress = (checkInDate: string, checkOutDate: string) => {
    const now = new Date();
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return { percent: 0, label: 'Upcoming' };
    }
    if (now <= start) {
      return { percent: 0, label: 'Upcoming' };
    }
    if (now >= end) {
      return { percent: 100, label: 'Completed' };
    }
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
    return { percent, label: 'In progress' };
  };
  
  return (
    <div>
      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              !status 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusChange('PENDING')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === 'PENDING' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleStatusChange('CONFIRMED')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === 'CONFIRMED' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => handleStatusChange('CHECKED_IN')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === 'CHECKED_IN' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Checked In
          </button>
          <button
            onClick={() => handleStatusChange('CHECKED_OUT')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === 'CHECKED_OUT' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => handleStatusChange('CANCELLED')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === 'CANCELLED' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>
      
      {/* Bookings Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          ))}
        </div>
      ) : displayBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <Bed className="mb-2 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don&apos;t have any bookings {status ? `with status: ${status}` : ''}.
          </p>
          <Link
            href="/hotels"
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Browse Hotels
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {displayBookings.map(booking => {
            const { percent, label } = getStayProgress(booking.checkInDate, booking.checkOutDate);
            return (
            <div 
              key={booking.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="grid md:grid-cols-3">
                {/* Hotel Image */}
                <div className="relative h-48 w-full md:h-full">
                  {booking.hotel.images[0] ? (
                    <Image
                      src={booking.hotel.images[0]}
                      alt={booking.hotel.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <Hotel className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Booking Details */}
                <div className="p-6 md:col-span-2">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {booking.hotel.name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="mr-1 h-4 w-4" />
                        <span>
                          {booking.hotel.city}, {booking.hotel.country}
                        </span>
                      </div>
                    </div>
                    
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Room</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {booking.room.name} ({booking.room.type})
                        {booking.numberOfRooms && booking.numberOfRooms > 1 && (
                          <span className="ml-2 text-sm text-primary">
                            × {booking.numberOfRooms} rooms
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</p>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                      <p className="font-bold text-primary">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Booking ID</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        #{booking.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    {/* Stay progress */}
                    <div className="sm:col-span-2">
                      <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Stay Progress
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{label}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Link
                      href={`/customer/bookings/${booking.id}`}
                      className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {!isLoading && displayBookings.length > 0 && (
        <div className="mt-6 flex items-center justify-center">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (page <= 3) {
                pageToShow = i + 1;
              } else if (page >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = page - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(pageToShow)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                    page === pageToShow
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageToShow}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}