import { Metadata } from 'next';
import HotelListing from '@/components/hotels/HotelListing';
import SearchFilters from '@/components/hotels/SearchFilters';
import { getHotels, getAmenities } from '@/services/hotel.service';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Find Hotels | Qaras Hotels',
  description: 'Browse and book hotels for your next trip.',
};

export const dynamic = 'force-dynamic';

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Extract search parameters
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const location = searchParams.location as string | undefined;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const capacity = searchParams.capacity ? Number(searchParams.capacity) : undefined;
  const amenities = searchParams.amenities 
    ? Array.isArray(searchParams.amenities)
      ? searchParams.amenities
      : [searchParams.amenities]
    : undefined;
  
  // Fetch amenities for filters
  const allAmenities = await getAmenities();
  
  // Prepare filters
  const filters = {
    location,
    minPrice,
    maxPrice,
    capacity,
    amenities,
  };

  // Fetch hotels data
  const { hotels, pagination } = await getHotels(filters, page);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Find Your Perfect Stay</h2>
          <p className="text-sm mx-auto max-w-2xl text-gray-700 dark:text-gray-300">
            Browse through our curated selection of hotels and find the perfect accommodation for your next trip.
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters 
              currentFilters={filters} 
              amenities={allAmenities} 
            />
          </div>
          
          {/* Hotel Listings */}
          <div className="lg:col-span-3">
            {hotels.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No Hotels Found</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  We couldn't find any hotels matching your search criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <HotelListing hotels={hotels} pagination={pagination} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}