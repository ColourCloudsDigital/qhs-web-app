'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { PencilIcon, TrashIcon, ArrowLeftIcon, StarIcon, BuildingOffice2Icon, PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Wifi, Coffee, Tv, Utensils, Car, Dumbbell, Bath, Snowflake, WavesLadder, 
  Baby, Dog, Shield, Wind, Umbrella, Users } from 'lucide-react';
import ImageLightbox from '@/components/common/ImageLightbox';

const iconMap: Record<string, React.ReactNode> = {
  'wifi': <Wifi className="h-5 w-5" />,
  'coffee': <Coffee className="h-5 w-5" />,
  'tv': <Tv className="h-5 w-5" />,
  'restaurant': <Utensils className="h-5 w-5" />,
  'parking': <Car className="h-5 w-5" />,
  'gym': <Dumbbell className="h-5 w-5" />,
  'pool': <Bath className="h-5 w-5" />,
  'ac': <Snowflake className="h-5 w-5" />,
  'air-conditioning': <Snowflake className="h-5 w-5" />,
  'spa': <WavesLadder className="h-5 w-5" />,
  'baby': <Baby className="h-5 w-5" />,
  'pets': <Dog className="h-5 w-5" />,
  'security': <Shield className="h-5 w-5" />,
  'fan': <Wind className="h-5 w-5" />,
  'beach': <Umbrella className="h-5 w-5" />,
  'meeting': <Users className="h-5 w-5" />,
};

function AmenityIcon({ icon, name }: { icon: string; name: string }) {
  // Try to get icon by the icon field
  if (icon && iconMap[icon.toLowerCase()]) {
    return iconMap[icon.toLowerCase()];
  }
  
  // Try to get icon by name
  if (iconMap[name.toLowerCase()]) {
    return iconMap[name.toLowerCase()];
  }
  
  // Default icon - use first character of amenity name
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface HotelDetailPageProps {
  params: {
    hotelId: string;
  };
}

interface HotelData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  rating: number;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    name: string;
  };
  amenities: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
  }[];
  rooms: {
    id: string;
    name: string;
    type: string;
    roomTypeId?: string;
    roomTypeName?: string;
    roomNumber?: string;
    description: string;
    capacity: number;
    pricePerNight?: number;
    price?: number;
    discountedPrice?: number;
    images: string[];
    status: string;
    bookingCount: number;
  }[];
  whitelabelConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  } | null;
  status?: string;
}

const ImageGallery = ({ images, openLightbox }: { images: string[], openLightbox: (index: number) => void }) => {
  if (!images || images.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
        <BuildingOffice2Icon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
      <div 
        className="relative col-span-2 row-span-2 h-64 w-full cursor-pointer overflow-hidden rounded-lg md:h-80" 
        onClick={() => openLightbox(0)}
      >
        <Image
          src={images[0]}
          alt="Hotel primary photo"
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          width={600}
          height={400}
        />
      </div>
      {images.slice(1, 5).map((image, index) => (
        <div 
          key={index} 
          className="relative h-40 w-full cursor-pointer overflow-hidden rounded-lg md:h-32"
          onClick={() => openLightbox(index + 1)}
        >
          <Image
            src={image}
            alt={`Hotel photo ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            width={300}
            height={200}
          />
        </div>
      ))}
      {images.length > 5 && (
        <div 
          className="relative h-40 w-full cursor-pointer overflow-hidden rounded-lg md:h-32"
          onClick={() => openLightbox(5)}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <span className="text-lg font-semibold">+{images.length - 5} more</span>
          </div>
          <Image
            src={images[5]}
            alt={`Hotel photo ${5}`}
            className="h-full w-full object-cover"
            width={300}
            height={200}
          />
        </div>
      )}
    </div>
  );
};

export default function HotelDetailPage({ params }: HotelDetailPageProps) {
  const hotelId = params.hotelId;
  const router = useRouter();
  
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  useEffect(() => {
    fetchHotelData();
  }, []);
  
  const fetchHotelData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/hotels/${hotelId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotel data');
      }
      
      const responseData = await response.json();
      console.log('Hotel API response:', responseData);
      
      if (!responseData.hotel) {
        throw new Error('Invalid response format - missing hotel data');
      }
      
      setHotelData(responseData.hotel);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel data');
      console.error('Error fetching hotel:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteHotel = async () => {
    if (!confirm('Are you sure you want to delete this hotel? This action cannot be undone and will remove all associated rooms and bookings.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete hotel');
      }
      
      // Redirect to hotels list on success
      router.push('/admin/hotels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hotel');
      console.error('Error deleting hotel:', err);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading hotel data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !hotelData) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="mb-4 text-red-500">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Error</h2>
        <p className="mb-4 text-center text-gray-600 dark:text-gray-400">{error || 'Failed to load hotel data'}</p>
        <div className="flex space-x-3">
          <Link 
            href="/admin/hotels" 
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Hotels
          </Link>
          <button
            onClick={fetchHotelData}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const renderRatingStars = (rating: number) => {
    // Ensure rating is a valid number
    const numericRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <StarIcon 
            key={index} 
            className={`h-5 w-5 ${
              index < Math.floor(numericRating) 
                ? 'text-yellow-400 fill-current' 
                : index < Math.ceil(numericRating) && index >= Math.floor(numericRating)
                  ? 'text-yellow-400 fill-current opacity-50'
                  : 'text-gray-300'
            }`} 
          />
        ))}
        <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
          {numericRating.toFixed(1)}
        </span>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/admin/hotels" 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hotelData.name}</h1>
        </div>
        
        <div className="flex space-x-3">
          <Link 
            href={`/admin/hotels/${hotelId}/edit`}
            className="flex items-center rounded-md bg-amber-100 px-4 py-2 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900/75"
          >
            <PencilIcon className="mr-1.5 h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDeleteHotel}
            className="flex items-center rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/75"
          >
            <TrashIcon className="mr-1.5 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="mb-4">
                <ImageGallery images={hotelData.images} openLightbox={openLightbox} />
              </div>
              
              <div className="px-6 pb-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">About this property</h2>
                <p className="text-gray-700 dark:text-gray-300">{hotelData.description}</p>
                
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Phone:</span> {hotelData.phone}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Email:</span> {hotelData.email}
                      </p>
                      {hotelData.website && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Website:</span>{' '}
                          <a 
                            href={hotelData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {hotelData.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Location</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {hotelData.address}<br />
                      {hotelData.city}, {hotelData.state} {hotelData.zipCode}<br />
                      {hotelData.country}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Amenities Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              {hotelData.amenities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No amenities have been added to this hotel.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {hotelData.amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
                        {/* @ts-ignore - AmenityIcon does work as a JSX component but TypeScript is confused */}
                        <AmenityIcon icon={amenity.icon} name={amenity.name} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {amenity.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Rooms Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rooms</CardTitle>
              <Link
                href={`/admin/hotels/${hotelId}/rooms/create`}
                className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                <PlusIcon className="mr-1.5 h-4 w-4" />
                Add Room
              </Link>
            </CardHeader>
            <CardContent>
              {hotelData.rooms.length === 0 ? (
                <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-center text-yellow-700 dark:text-yellow-500">
                    No rooms have been added to this hotel yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {hotelData.rooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/admin/hotels/${hotelId}/rooms/${room.id}`}
                      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-all hover:shadow-md dark:border-gray-700"
                    >
                      <div className="relative h-40 w-full">
                        {room.images?.[0] ? (
                          <Image
                            src={room.images[0]}
                            alt={room.name}
                            className="h-full w-full object-cover"
                            width={300}
                            height={150}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <BuildingOffice2Icon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-800">
                              {room.roomTypeName || room.type}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              room.status === 'available' || room.status === 'AVAILABLE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : room.status === 'maintenance' || room.status === 'MAINTENANCE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : room.status === 'cleaning' || room.status === 'CLEANING'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {room.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">{room.name}</h3>
                          {room.roomNumber && (
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              Room {room.roomNumber}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Users className="mr-1 h-3 w-3" />
                            {room.capacity} {room.capacity > 1 ? 'guests' : 'guest'}
                          </span>
                        </div>
                        <div className="mt-auto pt-3">
                          <span className="text-lg font-bold text-primary dark:text-primary-light">
                            ₦{(room.pricePerNight || room.price || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400"> per night</span>
                          {room.discountedPrice && (
                            <span className="ml-2 text-sm text-gray-500 line-through dark:text-gray-400">
                              ₦{room.discountedPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar - Right Side */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</p>
                <div className="mt-1 flex items-center">
                  {renderRatingStars(hotelData.rating)}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    hotelData.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : hotelData.status === 'MAINTENANCE'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {hotelData.status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</p>
                <Link 
                  href={`/admin/vendors/${hotelData.vendor.id}`}
                  className="mt-1 text-base font-medium text-primary hover:underline"
                >
                  {hotelData.vendor.name}
                </Link>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(hotelData.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(hotelData.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Image lightbox */}
      <ImageLightbox
        images={hotelData.images}
        isOpen={lightboxOpen}
        setIsOpen={setLightboxOpen}
        startIndex={lightboxIndex}
      />
    </div>
  );
}