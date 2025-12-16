'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ImageLightbox from '@/components/common/ImageLightbox';
import toast from '@/lib/toast';
import { Loader2, Wifi, Bath, Dumbbell, UtensilsCrossed, Coffee, Building2, Car, Clock, 
  BedDouble, Tv, Sparkles, CheckCircle, AirVent, BarChartHorizontal } from 'lucide-react';

interface RoomDetailPageProps {
  params: {
    hotelId: string;
    roomId: string;
  };
}

interface RoomData {
  id: string;
  name: string;
  type: string;
  description: string;
  capacity: string | number;
  pricePerNight: string | number;
  discountedPrice?: string | number;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  bedsCount?: string | number;
  bathroomsCount?: string | number;
  size?: string | number;
  amenities: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category?: string;
  }[];
  hotel: {
    id: string;
    name: string;
  };
  basePrice?: string | number;
  bedType?: string;
}

export default function RoomDetailPage({ params }: RoomDetailPageProps) {
  const hotelId = params.hotelId;
  const roomId = params.roomId;
  const router = useRouter();
  
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  useEffect(() => {
    fetchRoomData();
  }, []);
  
  const fetchRoomData = async () => {
    try {
      setLoading(true);
      console.log(`Fetching room data for room ID: ${roomId}`);
      
      const response = await fetch(`/api/admin/rooms/${roomId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error (${response.status}):`, errorData);
        
        if (response.status === 401) {
          throw new Error('You are not authenticated. Please log in.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this room.');
        } else if (response.status === 404) {
          throw new Error('Room not found. It may have been deleted.');
        } else {
          throw new Error(errorData.error || 'Failed to fetch room data');
        }
      }
      
      const { room } = await response.json();
      console.log('Room data received:', room);
      setRoomData(room);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load room data';
      setError(errorMessage);
      console.error('Error fetching room:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone and will remove all associated bookings.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete room');
      }
      
      toast.success('Room deleted successfully');
      
      // Redirect to hotel details page on success
      router.push(`/admin/hotels/${hotelId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error deleting room:', err);
    }
  };
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading room data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !roomData) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Alert variant="error" className="mb-4 max-w-xl">
          <AlertTitle>Error Loading Room Data</AlertTitle>
          <AlertDescription className="text-sm">
            <div className="mb-2">{error || 'Failed to load room data'}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Room ID: {roomId} | Hotel ID: {hotelId}
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex space-x-3">
          <Link 
            href={`/admin/hotels/${hotelId}`} 
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Hotel
          </Link>
          <Button 
            onClick={() => {
              setError(null);
              fetchRoomData();
            }}
            className="bg-primary hover:bg-primary-dark"
          >
            <span className="mr-2">Retry</span>
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />
          </Button>
        </div>
      </div>
    );
  }
  
  // Helper function to get room status
  const getRoomStatus = () => {
    // Return the actual status from the database
    return roomData.status || 'Unknown';
  };
  
  // Helper function to get price
  const getRoomPrice = () => {
    // Try different potential price fields
    const price = parseFloat(roomData.pricePerNight as string) || 
                  parseFloat(roomData.basePrice as string) || 0;
    return price;
  };

  // Format currency with Naira symbol
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Helper function to map amenity icon string to corresponding component
  const getAmenityIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'wifi': <Wifi className="h-5 w-5" />,
      'pool': <Bath className="h-5 w-5" />,
      'fitness': <Dumbbell className="h-5 w-5" />,
      'restaurant': <UtensilsCrossed className="h-5 w-5" />,
      'bar': <Coffee className="h-5 w-5" />,
      'spa': <Sparkles className="h-5 w-5" />,
      'meeting': <Building2 className="h-5 w-5" />,
      'parking': <Car className="h-5 w-5" />,
      'reception': <Clock className="h-5 w-5" />,
      'room-service': <UtensilsCrossed className="h-5 w-5" />,
      'ac': <AirVent className="h-5 w-5" />,
      'tv': <Tv className="h-5 w-5" />,
    };

    return iconMap[iconName?.toLowerCase()] || (
      <CheckCircle className="h-5 w-5" />
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/admin/hotels/${hotelId}`} 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {roomData.hotel?.name ? `${roomData.hotel.name} - ${roomData.name}` : roomData.name}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link 
            href={`/admin/hotels/${hotelId}/rooms/${roomId}/edit`}
            className="flex items-center rounded-md bg-amber-100 px-4 py-2 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900/75"
          >
            <PencilIcon className="mr-1.5 h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDeleteRoom}
            className="flex items-center rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/75"
          >
            <TrashIcon className="mr-1.5 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Room Gallery */}
      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Gallery</h2>
          {roomData.images && roomData.images.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roomData.images.map((image, index) => (
                <div 
                  key={index} 
                  className="relative h-48 overflow-hidden rounded-lg shadow-sm cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={image}
                    alt={`${roomData.name} image ${index + 1}`}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      // Fallback for broken images
                      (e.target as HTMLImageElement).src = '/assets/images/placeholder.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 p-6 text-center dark:bg-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No images available for this room.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Room Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Room Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{roomData.name || 'Unnamed Room'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bed Type</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{roomData.bedType || 'Standard'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
              <p className="font-medium text-gray-900 dark:text-white">{roomData.description || 'No description available'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatNaira(getRoomPrice())}
                </p>
                {roomData.discountedPrice && parseFloat(roomData.discountedPrice as string) > 0 && (
                  <p className="text-xs text-red-600 line-through">
                    {formatNaira(parseFloat(roomData.discountedPrice as string))}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  getRoomStatus() === 'AVAILABLE' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : getRoomStatus() === 'MAINTENANCE'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : getRoomStatus() === 'CLEANING'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {getRoomStatus()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roomData.capacity} {Number(roomData.capacity) === 1 ? 'Person' : 'People'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Beds</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roomData.bedsCount || '1'} {Number(roomData.bedsCount || 1) === 1 ? 'Bed' : 'Beds'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bathrooms</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roomData.bathroomsCount || '1'} {Number(roomData.bathroomsCount || 1) === 1 ? 'Bathroom' : 'Bathrooms'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {roomData.size ? `${roomData.size} sq ft` : 'Not specified'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(roomData.createdAt)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(roomData.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          {roomData.amenities && roomData.amenities.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {roomData.amenities.map((amenity, index) => (
                <div key={amenity.id || index} className="flex items-start space-x-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex h-6 w-6 items-center justify-center text-primary">
                    {amenity.icon ? 
                      getAmenityIcon(amenity.icon)
                    : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary">
                        {amenity.name ? amenity.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{amenity.name || 'Unknown Amenity'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{amenity.description || 'No description available'}</p>
                    {amenity.category && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Category: <span className="font-medium">{amenity.category}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 p-6 text-center dark:bg-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No amenities available for this room.</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                You can add amenities by editing this room.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Image Lightbox */}
      {lightboxOpen && roomData.images && roomData.images.length > 0 && (
        <ImageLightbox
          images={roomData.images}
          isOpen={lightboxOpen}
          setIsOpen={setLightboxOpen}
          startIndex={lightboxIndex}
          title={roomData.name}
        />
      )}
    </div>
  );
}