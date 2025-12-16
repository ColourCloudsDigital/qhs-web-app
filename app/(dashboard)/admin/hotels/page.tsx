'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  ArrowPathIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { formatDate } from '@/lib/utils';

interface Hotel {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  rating: number;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: string;
  roomCount: number;
  vendor?: {
    id: string;
    name?: string;
    companyName?: string;
  };
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchHotels();
  }, [page, pageSize, searchQuery, sortColumn, sortDirection]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortColumn,
        sortDirection,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Get vendor ID from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const vendorIdFromUrl = urlParams.get('vendorId');
      
      if (vendorIdFromUrl) {
        params.append('vendorId', vendorIdFromUrl);
      }
      
      const response = await fetch(`/api/admin/hotels?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const data = await response.json();
      
      setHotels(data.hotels);
      setTotalItems(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for URL changes that might affect our filters
    const handleRouteChange = () => {
      fetchHotels();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const handleDeleteHotel = async (hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel? This will delete all associated rooms and bookings.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete hotel');
      }
      
      // Refresh the hotel list
      fetchHotels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hotel');
    }
  };

  const renderRatingStars = (rating: number) => {
    // Ensure rating is a valid number
    const numericRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <StarIcon 
            key={index} 
            className={`h-4 w-4 ${
              index < Math.floor(numericRating) 
                ? 'text-yellow-400 fill-current' 
                : index < Math.ceil(numericRating) && index >= Math.floor(numericRating)
                  ? 'text-yellow-400 fill-current opacity-50'
                  : 'text-gray-300'
            }`} 
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {numericRating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hotels Management</h1>
        <Link 
          href="/admin/hotels/create" 
          className="flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add Hotel
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="mt-2 rounded-md bg-red-50 text-sm font-medium text-red-800 hover:underline dark:bg-transparent dark:text-red-200"
                onClick={fetchHotels}
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="mr-1 h-4 w-4" />
                  Retry
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={hotels}
        columns={[
          { key: 'name', title: 'Hotel Name', sortable: true },
          { 
            key: 'vendor', 
            title: 'Vendor', 
            sortable: true,
            render: (hotel) => (
              <Link 
                href={`/admin/users/${hotel.vendor?.id || '#'}`}
                className="text-primary hover:underline"
              >
                {hotel.vendor?.name || hotel.vendor?.companyName || 'Unknown Vendor'}
              </Link>
            )
          },
          { 
            key: 'location', 
            title: 'Location', 
            render: (hotel) => (
              <span>{[hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ')}</span>
            )
          },
          { 
            key: 'rating', 
            title: 'Rating', 
            sortable: true,
            render: (hotel) => renderRatingStars(hotel.rating)
          },
          { 
            key: 'roomCount', 
            title: 'Rooms', 
            sortable: true,
          },
          { 
            key: 'isActive', 
            title: 'Status', 
            render: (hotel) => {
              // Determine the color based on status
              let colorClasses = '';
              switch (hotel.status) {
                case 'ACTIVE':
                  colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                  break;
                case 'MAINTENANCE':
                  colorClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
                  break;
                case 'INACTIVE':
                  colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                  break;
                default:
                  colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
              }
              
              return (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colorClasses}`}>
                  {hotel.status || (hotel.isActive ? 'Active' : 'Inactive')}
                </span>
              );
            }
          },
          { 
            key: 'createdAt', 
            title: 'Created', 
            sortable: true,
            render: (hotel) => formatDate(hotel.createdAt)
          },
          { 
            key: 'actions', 
            title: 'Actions',
            render: (hotel) => (
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/admin/hotels/${hotel.id}`}
                  className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  <EyeIcon className="h-5 w-5" />
                </Link>
                <Link 
                  href={`/admin/hotels/${hotel.id}/edit`}
                  className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
                >
                  <PencilIcon className="h-5 w-5" />
                </Link>
                <button 
                  onClick={() => handleDeleteHotel(hotel.id)}
                  className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            )
          },
        ]}
        pagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        totalItems={totalItems}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSort={handleSort}
        searchable={true}
        onSearch={handleSearch}
        loading={loading}
      />
    </div>
  );
}