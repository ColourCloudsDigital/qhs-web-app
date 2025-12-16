'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useHotel } from '@/contexts/HotelContext';
import {
  PencilIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

type Hotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  images: string[];
  roomCount?: number;
  bookingCount?: number;
  revenue?: number;
};

export default function VendorHotelsPage() {
  const router = useRouter();
  const { hotels, loading: hotelsLoading, refetchHotels } = useHotel();
  const [hotelDetails, setHotelDetails] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotelStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get detailed stats for each hotel
      const hotelDetailsPromises = hotels.map(async (hotel) => {
        try {
          const response = await fetch(`/api/vendor/hotels/${hotel.id}/stats`);
          
          if (!response.ok) {
            console.error(`Failed to fetch stats for hotel ${hotel.id}`);
            return {
              ...hotel,
              roomCount: 0,
              bookingCount: 0,
              revenue: 0,
            };
          }
          
          const data = await response.json();
          return {
            ...hotel,
            roomCount: data.roomCount || 0,
            bookingCount: data.bookingCount || 0,
            revenue: data.revenue || 0,
          };
        } catch (err) {
          console.error(`Error fetching stats for hotel ${hotel.id}:`, err);
          return {
            ...hotel,
            roomCount: 0,
            bookingCount: 0,
            revenue: 0,
          };
        }
      });

      const hotelsWithStats = await Promise.all(hotelDetailsPromises);
      setHotelDetails(hotelsWithStats);
    } catch (err) {
      console.error('Error fetching hotel details:', err);
      setError('Failed to load hotel details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [hotels]);

  useEffect(() => {
    if (hotels && hotels.length > 0) {
      fetchHotelStats();
    } else {
      setLoading(false);
    }
  }, [hotels, fetchHotelStats]);

  const getDefaultImage = (hotel: Hotel) => {
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images[0];
    }
    return '/assets/images/placeholder-hotel.jpg';
  };

  // Handle refreshing the hotel list
  const handleRefresh = () => {
    refetchHotels();
  };

  // Display loading state
  if (hotelsLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Hotels</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/vendor/hotels/create">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Hotel
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 p-2 dark:bg-gray-700">
            <BuildingOfficeIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Hotels Yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first hotel.
          </p>
          <Link href="/vendor/hotels/create" className="mt-4">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Your First Hotel
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hotelDetails.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={getDefaultImage(hotel)}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-xl font-bold text-white">{hotel.name}</h3>
                  <p className="text-sm text-gray-200">
                    {hotel.city}, {hotel.state}
                  </p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{hotel.roomCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Rooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{hotel.bookingCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(hotel.revenue || 0)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
                  </div>
                </div>
              </CardContent>
              <div className="flex border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/vendor/hotels/${hotel.id}`}
                  className="flex flex-1 items-center justify-center border-r border-gray-200 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <EyeIcon className="mr-1 h-4 w-4" />
                  Details
                </Link>
                <Link
                  href={`/vendor/hotels/${hotel.id}/edit`}
                  className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                >
                  <PencilIcon className="mr-1 h-4 w-4" />
                  Edit
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}