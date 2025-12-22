'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, MapPin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Hotel {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  images: string[];
  rating: number | null;
  startingPrice: number | null;
  discountedPrice: number | null;
  totalRooms: number;
  amenities: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface HotelListingProps {
  hotels: Hotel[];
  pagination: Pagination;
}

export default function HotelListing({ hotels, pagination }: HotelListingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  const handlePageChange = (pageNumber: number) => {
    router.push(createPageURL(pageNumber));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{hotels.length}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> hotels
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('grid')}
            className={`rounded p-2 ${
              view === 'grid'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            aria-label="Grid view"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded p-2 ${
              view === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            aria-label="List view"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <GridHotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {hotels.map((hotel) => (
            <ListHotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </button>
          
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
            // Show only current page, first, last, and pages around current
            if (
              page === 1 ||
              page === pagination.pages ||
              (page >= pagination.page - 1 && page <= pagination.page + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    pagination.page === page
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            }
            
            // Show ellipsis for gaps
            if (
              (page === 2 && pagination.page > 3) ||
              (page === pagination.pages - 1 && pagination.page < pagination.pages - 2)
            ) {
              return <span key={page} className="px-2">...</span>;
            }
            
            return null;
          })}
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function GridHotelCard({ hotel }: { hotel: Hotel }) {
  
  const hotelId = hotel.id;
  
  return (
    <Link 
      href={`/hotels/${hotelId}`} 
      className="block h-full transform transition-all hover:-translate-y-1 focus:outline-none"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={hotel.images[0] || '/images/placeholder-hotel.jpg'}
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={true}
          />
          {hotel.rating && (
            <div className="absolute right-3 top-3 flex items-center rounded-md bg-white/90 px-2 py-1 shadow-md backdrop-blur-sm dark:bg-gray-900/90">
              <Star className="mr-1 h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold">{hotel.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{hotel.name}</h3>
          </div>
          
          <div className="mb-2 flex items-center text-gray-600 dark:text-gray-400">
            <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">
              {hotel.city}, {hotel.state}, {hotel.country}
            </span>
          </div>
          
          <p className="mb-4 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{hotel.description}</p>
          
          <div className="mb-4 flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <span 
                key={amenity.id} 
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {amenity.name}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                +{hotel.amenities.length - 3} more
              </span>
            )}
          </div>
          
          <div className="mt-auto">
            {hotel.startingPrice && (
              <div className="mb-3 flex items-baseline">
                {hotel.discountedPrice ? (
                  <>
                    <span className="text-xl font-bold text-primary">{formatCurrency(hotel.discountedPrice)}</span>
                    <span className="ml-2 text-sm text-gray-500 line-through dark:text-gray-400">{formatCurrency(hotel.startingPrice)}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-primary">{formatCurrency(hotel.startingPrice)}</span>
                )}
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/night</span>
              </div>
            )}
            
            <button
              className="w-full rounded-md bg-primary py-2 text-center font-medium text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ListHotelCard({ hotel }: { hotel: Hotel }) {
  
  const hotelId = hotel.id;  
  return (
    <Link 
      href={`/hotels/${hotelId}`} 
      className="block transform transition-all hover:-translate-y-1 focus:outline-none">
      <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
        <div className="flex flex-col md:flex-row">
          <div className="relative h-56 w-full md:h-auto md:w-1/3">
            <Image
              src={hotel.images[0] || '/images/placeholder-hotel.jpg'}
              alt={hotel.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {hotel.rating && (
              <div className="absolute right-3 top-3 flex items-center rounded-md bg-white/90 px-2 py-1 shadow-md backdrop-blur-sm dark:bg-gray-900/90">
                <Star className="mr-1 h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold">{hotel.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{hotel.name}</h3>
            </div>
            
            <div className="mb-2 flex items-center text-gray-600 dark:text-gray-400">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {hotel.city}, {hotel.state}, {hotel.country}
              </span>
            </div>
            
            <p className="mb-4 line-clamp-2 text-gray-700 dark:text-gray-300">{hotel.description}</p>
            
            <div className="mb-4 flex flex-wrap gap-2">
              {hotel.amenities.slice(0, 5).map((amenity) => (
                <span 
                  key={amenity.id} 
                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {amenity.name}
                </span>
              ))}
              {hotel.amenities.length > 5 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  +{hotel.amenities.length - 5} more
                </span>
              )}
            </div>
            
            <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-3 sm:mb-0">
                {hotel.startingPrice && (
                  <div className="flex items-baseline">
                    {hotel.discountedPrice ? (
                      <>
                        <span className="text-xl font-bold text-primary">{formatCurrency(hotel.discountedPrice)}</span>
                        <span className="ml-2 text-sm text-gray-500 line-through dark:text-gray-400">{formatCurrency(hotel.startingPrice)}</span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-primary">{formatCurrency(hotel.startingPrice)}</span>
                    )}
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/night</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">{hotel.totalRooms} rooms available</p>
              </div>
              
              <button
                className="rounded-md bg-primary px-6 py-2 text-center font-medium text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}