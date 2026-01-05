'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Eye,
  Pencil,
  FileText,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import BookingStatusBadge from './BookingStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';
import Modal from '@/components/ui/Modal';
import BookingDetailClient from '../bookings/[id]/client';
import BookingEditClient from '../bookings/[id]/edit/client';
import BookingDocuments from './BookingDocuments';
import { useBookingModalsStore } from './bookingModalsStore';
import { AnimatePresence, motion } from 'framer-motion';

interface Booking {
  id: string;
  hotel: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    name: string;
    type: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    firstName?: string;
    lastName?: string;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface BookingsListProps {
  vendorId: string;
  page: number;
  limit: number;
  status?: string;
  search?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  hotelId?: string;
}

export default function BookingsList({
  vendorId,
  page,
  limit,
  status,
  search,
  checkInDate,
  checkOutDate,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  hotelId,
}: BookingsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Use currentHotel.id from context if available, otherwise fall back to hotelId prop
  const selectedHotelId = hotelId;
  
  const {
    modalType,
    bookingId,
    setModal,
    closeModal,
    viewMode: bookingViewMode,
    setViewMode: setBookingViewMode,
  } = useBookingModalsStore();
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalBooking, setModalBooking] = useState<any | null>(null);
  
  // 1. Define loadBookingsFromIndexedDB
  const loadBookingsFromIndexedDB = useCallback(async () => {
    try {
      const db = await openDatabase();
      return await getAllItems(db, 'bookings');
    } catch {
      return [];
    }
  }, []);
  
  // 2. Define saveBookingsToIndexedDB
  const saveBookingsToIndexedDB = useCallback(async (bookings: Booking[]) => {
    try {
      const db = await openDatabase();
      await clearObjectStore(db, 'bookings');
      for (const booking of bookings) {
        await addItem(db, 'bookings', booking);
      }
    } catch {
      // ignore
    }
  }, []);
  
  // 3. Use these in fetchBookings, but do NOT include them in the dependency array
  const fetchBookings = useCallback(async () => {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());
      
      if (status) queryParams.set('status', status);
      if (search) queryParams.set('search', search);
      if (checkInDate) queryParams.set('checkInDate', checkInDate.toISOString());
      if (checkOutDate) queryParams.set('checkOutDate', checkOutDate.toISOString());
      if (sortBy) queryParams.set('sortBy', sortBy);
      if (sortOrder) queryParams.set('sortOrder', sortOrder);
      if (selectedHotelId) queryParams.set('hotelId', selectedHotelId);
      
      try {
        // Check if we're offline
        if (!navigator.onLine) {
          // Load bookings from IndexedDB
          const offlineBookings = await loadBookingsFromIndexedDB();
          if (offlineBookings && offlineBookings.length > 0) {
            setBookings(offlineBookings);
            setTotalPages(Math.ceil(offlineBookings.length / limit));
            setTotalItems(offlineBookings.length);
          }
        } else {
          // Fetch from API
          const response = await fetch(`/api/vendor/${vendorId}/bookings?${queryParams.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            setBookings(data.data);
            setTotalPages(data.meta.totalPages);
            setTotalItems(data.meta.totalItems);
            
            // Store in IndexedDB for offline use
            await saveBookingsToIndexedDB(data.data);
          } else {
            console.error('Failed to fetch bookings');
            
            // Try to load from IndexedDB as fallback
            const offlineBookings = await loadBookingsFromIndexedDB();
            if (offlineBookings && offlineBookings.length > 0) {
              setBookings(offlineBookings);
              setTotalPages(Math.ceil(offlineBookings.length / limit));
              setTotalItems(offlineBookings.length);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        
        // Try to load from IndexedDB as fallback
        const offlineBookings = await loadBookingsFromIndexedDB();
        if (offlineBookings && offlineBookings.length > 0) {
          setBookings(offlineBookings);
          setTotalPages(Math.ceil(offlineBookings.length / limit));
          setTotalItems(offlineBookings.length);
        }
      } finally {
        setIsLoading(false);
      }
  }, [vendorId, page, limit, status, search, checkInDate, checkOutDate, sortBy, sortOrder, selectedHotelId]);
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle sorting
  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortBy === column) {
      // Toggle sort order
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, set to default sort order (desc)
      params.set('sortBy', column);
      params.set('sortOrder', 'desc');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Use real data only
  const displayBookings = bookings;
  
  // State for offline mode
  const [isOffline, setIsOffline] = useState<boolean>(false);
  
  // Check network status
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    
    function handleOffline() {
      setIsOffline(true);
    }
    
    // Initial check
    setIsOffline(!navigator.onLine);
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Additional IndexedDB helper functions
  const openDatabase = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('qaras-hotels-offline', 2);
      request.onerror = () => reject('Failed to open IndexedDB');
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('bookings')) {
          db.createObjectStore('bookings', { keyPath: 'id' });
        }
      };
    });
  };
  
  const getAllItems = (db: IDBDatabase, storeName: string) => {
    return new Promise<any[]>((resolve, reject) => {
      try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
        request.onerror = () => resolve([]);
        request.onsuccess = () => resolve(request.result);
      } catch (err) {
        resolve([]);
      }
    });
  };
  
  const addItem = (db: IDBDatabase, storeName: string, item: any) => {
    return new Promise<void>((resolve, reject) => {
      try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
        request.onerror = () => resolve();
        request.onsuccess = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  };
  
  const clearObjectStore = (db: IDBDatabase, storeName: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
        request.onerror = () => resolve();
        request.onsuccess = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  };
  
  const getAllOperations = (db: IDBDatabase) => {
    return new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const request = store.getAll();
      
      request.onerror = () => {
        reject('Failed to get operations');
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  };
  
  const deleteOperation = (db: IDBDatabase, id: number) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.delete(id);
      
      request.onerror = () => {
        reject('Failed to delete operation');
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  };
  
  // Refactor modal logic: use booking from bookings array for modals
  useEffect(() => {
    if (modalType && bookingId) {
      setModalLoading(false);
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setModalBooking(booking);
        setModalError(null);
      } else {
        setModalBooking(null);
        setModalError('Booking not found');
      }
    } else {
      setModalBooking(null);
      setModalError(null);
    }
  }, [modalType, bookingId, bookings]);
  
  return (
    <>
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bookings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading 
              ? 'Loading bookings...'
              : `Showing ${displayBookings.length} of ${totalItems} bookings`
            }
            {isOffline && ' (Offline Mode)'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {isOffline && (
            <div className="rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
              Offline Mode
            </div>
          )}
          <button
              onClick={() => setBookingViewMode('list')}
            className={`rounded-md border px-3 py-1.5 text-sm ${
                bookingViewMode === 'list' 
                ? 'border-primary bg-primary text-white' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            List View
          </button>
          <button
              onClick={() => setBookingViewMode('grid')}
            className={`rounded-md border px-3 py-1.5 text-sm ${
                bookingViewMode === 'grid' 
                ? 'border-primary bg-primary text-white' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>
      
      {/* Offline Notice */}
      {isOffline && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Offline Mode</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  You are currently offline. You can still view your bookings and perform actions. 
                    All changes will be synchronized when you&apos;re back online.
                </p>
                </div>
              </div>
            </div>
          </div>
      )}
      
      {/* List View */}
        {bookingViewMode === 'list' && (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {isLoading ? (
              // Loading skeleton
              <div className="p-4">
                <div className="flex flex-col space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
                  ))}
                </div>
              </div>
            ) : displayBookings.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center p-8">
                <Calendar className="mb-2 h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or create a new booking.
                </p>
                <Link 
                  href="/vendor/bookings/new"
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none"
                >
                  Create Booking
                </Link>
              </div>
            ) : (
              // Bookings table
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        <div 
                          className="group flex cursor-pointer items-center"
                          onClick={() => handleSort('createdAt')}
                        >
                          <span>Booking ID</span>
                          <span className="ml-2 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {sortBy === 'createdAt' && (
                              sortOrder === 'asc' ? '↑' : '↓'
                            )}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        <div 
                          className="group flex cursor-pointer items-center"
                          onClick={() => handleSort('customer.name')}
                        >
                          <span>Customer</span>
                          <span className="ml-2 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {sortBy === 'customer.name' && (
                              sortOrder === 'asc' ? '↑' : '↓'
                            )}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        <div 
                          className="group flex cursor-pointer items-center"
                          onClick={() => handleSort('hotel.name')}
                        >
                          <span>Hotel / Room</span>
                          <span className="ml-2 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {sortBy === 'hotel.name' && (
                              sortOrder === 'asc' ? '↑' : '↓'
                            )}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        <div 
                          className="group flex cursor-pointer items-center"
                          onClick={() => handleSort('checkInDate')}
                        >
                          <span>Dates</span>
                          <span className="ml-2 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {sortBy === 'checkInDate' && (
                              sortOrder === 'asc' ? '↑' : '↓'
                            )}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        <div 
                          className="group flex cursor-pointer items-center"
                          onClick={() => handleSort('totalAmount')}
                        >
                          <span>Amount</span>
                          <span className="ml-2 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {sortBy === 'totalAmount' && (
                              sortOrder === 'asc' ? '↑' : '↓'
                            )}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        <div 
                          className="group flex cursor-pointer items-center"
                          onClick={() => handleSort('status')}
                        >
                          <span>Status</span>
                          <span className="ml-2 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {sortBy === 'status' && (
                              sortOrder === 'asc' ? '↑' : '↓'
                            )}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayBookings.map((booking) => (
                      <tr 
                        key={booking.id}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex flex-col">
                            <span>#{booking.id.slice(0, 8).toUpperCase()}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(booking.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <div>
                              <div>{booking.customer.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {booking.customer.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            <div>{booking.hotel.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {booking.room.name} ({booking.room.type})
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            <div>
                              <div>{formatDate(booking.checkInDate)}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                to {formatDate(booking.checkOutDate)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{formatCurrency(booking.totalAmount)}</div>
                              <div>
                                <PaymentStatusBadge status={booking.paymentStatus} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-2">
                              <button
                                onClick={() => setModal('view', booking.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setModal('edit', booking.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                              title="Edit Booking"
                            >
                              <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setModal('documents', booking.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                              title="Manage Documents"
                            >
                              <FileText className="h-4 w-4" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!isLoading && displayBookings.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> bookings
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Prev</span>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate page numbers to show
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
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                        page === pageToShow
                          ? 'border border-primary bg-primary-50 text-primary dark:border-primary dark:bg-primary/20 dark:text-primary-light'
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
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <span className="mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
      
      {/* Modal with AnimatePresence and motion for animation */}
      <AnimatePresence>
        {modalType && (
          <Modal
            isOpen={!!modalType}
            onClose={closeModal}
            title={modalType === 'view' ? 'Booking Details' : modalType === 'edit' ? 'Edit Booking' : modalType === 'documents' ? 'Booking Documents' : ''}
            maxWidth={modalType === 'documents' ? 'xl' : 'lg'}
          >
            <motion.div
              key={modalType + (bookingId || '')}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
            >
              {modalLoading ? (
                <div className="flex items-center justify-center py-12"><span>Loading...</span></div>
              ) : modalError ? (
                <div className="flex flex-col items-center justify-center py-12 text-red-600 dark:text-red-400">
                  <span className="mb-2 font-semibold">{modalError}</span>
                  <span className="text-sm">Please try again or contact support.</span>
                </div>
              ) : modalType === 'view' && modalBooking ? (
                <BookingDetailClient booking={modalBooking} vendorId={vendorId} />
              ) : modalType === 'edit' && modalBooking ? (
                <BookingEditClient booking={modalBooking} vendorId={vendorId} />
              ) : modalType === 'documents' && modalBooking ? (
                <BookingDocuments bookingId={modalBooking.id} />
              ) : null}
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}