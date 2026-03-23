'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  CheckIcon,
  HomeIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  CakeIcon,
  WifiIcon,
  TvIcon
} from '@heroicons/react/24/outline';
import { Bed as BedIcon, Bath as ShowerIcon, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from '@/lib/toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface ViewRoomPageProps {
  params: {
    hotelId: string;
    roomId: string;
  };
}

interface RoomData {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  basePrice?: number;
  discountedPrice?: number;
  status: string;
  images: string[];
  amenities: any[];
  roomType?: {
    id: string;
    name: string;
    description?: string;
    basePrice?: number;
  };
  hotel: {
    id: string;
    name: string;
  };
  roomNumber?: string;
  roomNumbers?: string[];
  bedsCount?: number;
  bathroomsCount?: number;
  size?: number;
  bedType: string;
  bookings?: any[];
}

// Map room type IDs to friendly names
const ROOM_TYPE_NAMES: Record<string, string> = {
  'standard': 'Standard Room',
  'deluxe': 'Deluxe Room',
  'suite': 'Suite',
  'executive': 'Executive Room',
  'family': 'Family Room',
  'penthouse': 'Penthouse Suite',
  'studio': 'Studio',
  'apartment': 'Apartment',
  'villa': 'Villa',
  'cottage': 'Cottage',
  'bungalow': 'Bungalow',
  'chalet': 'Chalet',
};

// Map amenity names to appropriate icons
const getAmenityIcon = (amenityName: string) => {
  // Convert to lowercase for case-insensitive matching
  const name = (amenityName || '').toLowerCase();
  
  // Match WiFi-related amenities
  if (name.includes('wifi') || name.includes('internet') || name.includes('wireless')) 
    return <WifiIcon className="h-4 w-4 text-green-500" />;
  
  // Match TV and entertainment amenities
  if (name.includes('tv') || name.includes('television') || name.includes('entertainment')) 
    return <TvIcon className="h-4 w-4 text-green-500" />;
  
  // Match bathroom amenities
  if (name.includes('shower') || name.includes('bathroom') || name.includes('bath') || name.includes('toilet')) 
    return <ShowerIcon className="h-4 w-4 text-green-500" />;
  
  // Match bed amenities
  if (name.includes('bed') || name.includes('mattress') || name.includes('linen') || name.includes('pillow')) 
    return <BedIcon className="h-4 w-4 text-green-500" />;
  
  // Match food amenities
  if (name.includes('breakfast') || name.includes('food') || name.includes('meal') || name.includes('kitchen')) 
    return <CakeIcon className="h-4 w-4 text-green-500" />;
  
  // Default icon
  return <CheckIcon className="h-4 w-4 text-green-500" />;
};

export default function ViewRoomPage({ params }: ViewRoomPageProps) {
  const { hotelId, roomId } = params;
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      unavailable: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      occupied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    const cls = map[(status || '').toLowerCase()] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls}`}>
        {status || 'Unknown'}
      </span>
    );
  };
  
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('');
  const [room, setRoom] = useState<RoomData | null>(null);
  const [similarRooms, setSimilarRooms] = useState<RoomData[]>([]);
  
  // Fetch room data when component mounts
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate room ID
        if (!roomId || roomId === 'undefined' || roomId === 'null') {
          console.error('Invalid room ID:', roomId);
          setError('Invalid room ID provided');
          return;
        }
        
        console.log(`Fetching room data for room ID: ${roomId}`);
        
        // Fetch room data
        const roomResponse = await fetch(`/api/vendor/rooms/${roomId}`);
        if (!roomResponse.ok) {
          const errorData = await roomResponse.json().catch(() => ({}));
          console.error(`Room API error (${roomResponse.status}):`, errorData);
          
          // If room not found and we're logged in, maybe try to fetch a valid room
          if (roomResponse.status === 404) {
            console.log('Room not found, redirecting to hotel page');
            // Redirect to the hotel page after a short delay
            setTimeout(() => {
              router.push(`/vendor/hotels/${hotelId}`);
            }, 3000);
          }
          
          throw new Error(
            errorData.error || 
            `Failed to fetch room data (${roomResponse.status})`
          );
        }
        
        const roomData = await roomResponse.json();
        console.log('Room data received:', roomData.room ? 'Success' : 'Empty response');
        
        if (!roomData.room) {
          throw new Error('Room data is empty or invalid');
        }
        
        // Log the images array
        console.log('Room images data:', 
          Array.isArray(roomData.room.images) 
            ? `${roomData.room.images.length} images: ${JSON.stringify(roomData.room.images)}` 
            : `No images array found or not an array: ${roomData.room.images}`);
        
        // Process amenities data
        if (roomData.room.amenities) {
          if (Array.isArray(roomData.room.amenities)) {
            console.log(`Found ${roomData.room.amenities.length} amenities`);
          } else {
            console.log('Amenities exists but is not an array:', typeof roomData.room.amenities);
            // Fix amenities if it's not an array
            roomData.room.amenities = [];
          }
        } else {
          console.log('No amenities data found');
          roomData.room.amenities = [];
        }
        
        setRoom(roomData.room);
        
        // Set similar rooms if available
        if (roomData.similarRooms && Array.isArray(roomData.similarRooms)) {
          console.log(`Found ${roomData.similarRooms.length} similar rooms`);
          setSimilarRooms(roomData.similarRooms);
        }
        
        // Fetch hotel name
        console.log(`Fetching hotel data for hotel ID: ${hotelId}`);
        const hotelResponse = await fetch(`/api/vendor/hotels/${hotelId}`);
        if (hotelResponse.ok) {
          const hotelData = await hotelResponse.json();
          setHotelName(hotelData.hotel.name || '');
        } else {
          console.warn(`Failed to fetch hotel name (${hotelResponse.status})`);
        }
      } catch (err) {
        console.error('Error fetching room data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load room data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoomData();
  }, [hotelId, roomId, router]);
  
  // Handle room deletion
  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/vendor/rooms/${roomId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete room');
      }
      
      toast.success('Room deleted successfully');
      
      // Redirect back to hotel details page
      router.push(`/vendor/hotels/${hotelId}`);
    } catch (err) {
      console.error('Error deleting room:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete room');
    } finally {
      setDeleting(false);
    }
  };
  
  // Get status badge color based on room status
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return <Badge variant="success">{status}</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">{status}</Badge>;
      case 'maintenance':
        return <Badge variant="warning">{status}</Badge>;
      case 'cleaning':
        return <Badge variant="warning">Cleaning</Badge>;
      default:
        return <Badge>{status || 'Unknown'}</Badge>;
    }
  };
  
  // Get friendly name for room type
  const getRoomTypeName = (typeId: string) => {
    return typeId ? (ROOM_TYPE_NAMES[typeId.toLowerCase()] || typeId) : 'Standard Room';
  };

  // Get bed type display
  const getBedTypeDisplay = (bedType: string, count: number = 1) => {
    return `${count > 1 ? `${count} × ` : ''}${bedType || 'Standard'}`;
  };

  // Get the best price to display (basePrice from room_type or pricePerNight)
  const getDisplayPrice = (room: RoomData) => {
    if (room.roomType?.basePrice) {
      return room.roomType.basePrice;
    }
    return room.basePrice || room.pricePerNight || 0;
  };
  
  // Get image URL - handle both full and relative paths
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/assets/images/placeholder-room.jpg';
    
    // If it's already a full URL or starts with a slash, use it directly
    if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // Otherwise, add a leading slash
    return `/${imagePath}`;
  };
  
  // Validate if images array exists and is valid
  const hasValidImages = () => {
    return room?.images && Array.isArray(room.images) && room.images.length > 0 && 
          room.images.some(img => img && typeof img === 'string');
  };
  
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }
  
  if (!room) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href={`/vendor/hotels/${hotelId}`}
              className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Not Found</h1>
            </div>
          </div>
        </div>
      
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Room not found or you don&apos;t have permission to view it.</p>
            <p className="text-sm">Error details: {error || "Unknown error"}</p>
            <p className="text-sm mt-2">Redirecting to hotel page in a few seconds...</p>
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Link href={`/vendor/hotels/${hotelId}`}>
            <Button>
              Return to Hotel
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/vendor/hotels/${hotelId}`}
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hotelName ? `${hotelName}` : ''}
              {room.roomType?.name && room.roomType.name !== room.name && ` - Type: ${room.roomType.name}`}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Link href={`/vendor/hotels/${hotelId}/rooms/${roomId}/edit`}>
            <Button variant="outline">
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleDeleteRoom} 
            disabled={deleting}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Images */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              {hasValidImages() ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {room.images.filter(img => img && typeof img === 'string').map((image: string, index: number) => {
                      console.log(`Rendering room image ${index}: ${image}`);
                      return (
                        <CarouselItem key={index}>
                          <div className="relative h-64 w-full sm:h-96">
                            <img
                              src={getImageUrl(image)}
                              alt={`${room.name} image ${index + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image: ${image}`);
                                e.currentTarget.src = '/assets/images/placeholder-room.jpg';
                              }}
                            />
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              ) : (
                <div className="flex h-64 w-full items-center justify-center bg-gray-200 sm:h-96">
                  <img
                    src="/assets/images/placeholder-room.jpg"
                    alt="No room image available"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p className="mt-1 text-gray-900 dark:text-white">{room.description}</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CurrencyDollarIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Per Night</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(getDisplayPrice(room))}
                      {room.discountedPrice && (
                        <span className="ml-2 text-sm text-red-500 line-through">
                          {formatCurrency(room.discountedPrice)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    {getStatusBadge(room.status)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center">
                  <HomeIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Room Size</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {room.size ? `${room.size} m²` : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BedIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bed Type</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getBedTypeDisplay(room.bedType, room.bedsCount)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ShowerIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bathrooms</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {room.bathroomsCount || 1}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Room Number(s)</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {room.roomNumbers && room.roomNumbers.length > 0
                    ? room.roomNumbers.join(', ')
                    : room.roomNumber || 'Not assigned'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Amenities */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Check if we have valid amenities - filter out any invalid entries */}
              {room.amenities && Array.isArray(room.amenities) && room.amenities.filter(a => a && a.name).length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {room.amenities
                    .filter(amenity => amenity && amenity.name) // Filter out empty or invalid amenities
                    .map((amenity: any, index: number) => (
                      <div key={amenity.id || `amenity-${index}`} className="flex items-center gap-2">
                        {getAmenityIcon(amenity.name)}
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                </div>
              ) : (
                // Show default amenities when none are configured
                <div>
                  <p className="text-sm text-gray-500 mb-4">No specific amenities assigned to this room. Basic amenities include:</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      {getAmenityIcon('Wifi')}
                      <span>WiFi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAmenityIcon('TV')}
                      <span>TV</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAmenityIcon('Bathroom')}
                      <span>Private Bathroom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAmenityIcon('Bed')}
                      <span>Fresh Linens</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          {room.bookings && room.bookings.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {room.bookings.map((booking: any) => {
                    const statusColors: Record<string, string> = {
                      CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                      CHECKED_IN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                      CHECKED_OUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                    };
                    const statusClass = statusColors[booking.status] || 'bg-gray-100 text-gray-800';
                    const guestName = [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.guestName || 'Guest';
                    const checkIn = booking.checkIn ? formatDate(booking.checkIn) : 'N/A';
                    const checkOut = booking.checkOut ? formatDate(booking.checkOut) : 'N/A';
                    return (
                      <div key={booking.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900 dark:text-white">{guestName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {checkIn} → {checkOut}
                            </p>
                            {booking.totalAmount && (
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatCurrency(booking.totalAmount)}
                              </p>
                            )}
                            {booking.roomNumber && (
                              <p className="text-xs text-gray-400">Room {booking.roomNumber}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Rooms */}
          {similarRooms.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Similar Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {similarRooms.map((similarRoom) => (
                    <Link 
                      key={similarRoom.id} 
                      href={`/vendor/hotels/${hotelId}/rooms/${similarRoom.id}`}
                      className="block"
                    >
                      <div className="overflow-hidden rounded-lg border transition hover:shadow">
                        <div className="relative h-40 bg-gray-200">
                          {similarRoom.images && similarRoom.images.length > 0 ? (
                            <img
                              src={similarRoom.images[0].startsWith('/') ? similarRoom.images[0] : `/${similarRoom.images[0]}`}
                              alt={similarRoom.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.jpg';
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-sm text-gray-500">No image</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium">{similarRoom.name}</h3>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Room {similarRoom.roomNumber || 'N/A'}
                            </span>
                            <span className="font-semibold text-primary">
                              {formatCurrency(getDisplayPrice(similarRoom))}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <span className="text-xs text-gray-500">
                              {similarRoom.capacity} {similarRoom.capacity === 1 ? 'Guest' : 'Guests'}
                            </span>
                            {getStatusBadge(similarRoom.status)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Room Type Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Room Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h3>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {room.roomType?.name || getRoomTypeName(room.type) || 'Standard Room'}
                  </p>
                </div>
                {room.roomType?.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type Description</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {room.roomType.description}
                    </p>
                  </div>
                )}
                {room.roomType?.basePrice && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Base Price</h3>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatCurrency(room.roomType.basePrice)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-4">
                <Link href={`/vendor/hotels/${hotelId}/rooms/${roomId}/edit`} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit Room Details
                  </Button>
                </Link>
              </div>
              
              <div className="mb-4">
                <Link href={`/vendor/hotels/${hotelId}/rooms/${roomId}/availability`} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Manage Availability
                  </Button>
                </Link>
              </div>
              
              <div className="mb-4">
                <Link href={`/vendor/hotels/${hotelId}/rooms/${roomId}/pricing`} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <BanknotesIcon className="mr-2 h-4 w-4" />
                    Manage Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <div className="text-center text-sm text-gray-500">
                Room Number: {room.roomNumber || 'Not assigned'}
              </div>
              <Button 
                variant="outline" 
                onClick={handleDeleteRoom} 
                disabled={deleting}
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrashIcon className="mr-2 h-4 w-4" />
                )}
                Delete Room
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}