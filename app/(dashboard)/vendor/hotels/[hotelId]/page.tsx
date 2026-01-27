'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  PencilIcon, 
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  HomeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { RoomList } from '@/components/vendor/RoomList';
import ImageLightbox from '@/components/common/ImageLightbox';
import toast from '@/lib/toast';
import { Loader2 } from 'lucide-react';

interface HotelDetailPageProps {
  params: {
    hotelId: string;
  };
}

export default function HotelDetailPage({ params }: HotelDetailPageProps) {
  const hotelId = params.hotelId;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    roomCount: 0,
    physicalRoomCount: 0,
    bookingCount: 0,
    revenue: 0,
    occupancyRate: 0,
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch hotel data (includes stats)
        const response = await fetch(`/api/vendor/hotels/${hotelId}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to fetch hotel data');
        }
        
        const data = await response.json();
        
        if (!data.hotel) {
          console.error('API returned success but no hotel data was found:', data);
          throw new Error('Hotel data not found in API response');
        }
        
        setHotel(data.hotel);
        
        // Stats are already included in the hotel data
        if (data.hotel.stats) {
          setStats(data.hotel.stats);
        }
        
      } catch (err) {
        console.error('Error fetching hotel data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hotel data');
        toast.error(err instanceof Error ? err.message : 'Failed to load hotel data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHotelData();
  }, [hotelId]);
  
  const handleDeleteHotel = async () => {
    if (!confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/vendor/hotels/${hotelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete hotel');
      }
      
      toast.success('Hotel deleted successfully');
      
      // Redirect back to hotels list
      router.push('/vendor/hotels');
    } catch (err) {
      console.error('Error deleting hotel:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete hotel');
    } finally {
      setDeleting(false);
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
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading hotel...</p>
        </div>
      </div>
    );
  }
  
  if (!hotel) {
    return (
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Hotel not found or you don&apos;t have permission to view it.</AlertDescription>
      </Alert>
    );
  }
  
  const getDefaultImage = () => {
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images[0];
    }
    return '/assets/images/placeholder-hotel.jpg';
  };
  
  // Get image URL with proper error handling
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/assets/images/placeholder-hotel.jpg';
    
    // If it's already a full URL or starts with a slash, use it directly
    if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // Otherwise, add a leading slash
    return `/${imagePath}`;
  };
  
  // Check if we have valid images to display
  const hasValidImages = () => {
    return hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0 && 
          hotel.images.some((img: string) => img && typeof img === 'string');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/vendor/hotels" 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hotel.name}</h1>
              {!hotel.isActive && (
                <Badge variant="outline" className="ml-2 bg-gray-200">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <HomeIcon className="mr-1 h-4 w-4" />
              <span>{hotel.city}, {hotel.state}, {hotel.country}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Link href={`/vendor/hotels/${hotelId}/edit`}>
            <Button variant="outline">
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Hotel
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleDeleteHotel} 
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
      
      {/* Modern Image Gallery */}
      {hasValidImages() ? (
        <div className="relative">
          <div className="grid grid-cols-5 gap-2 h-64">
            {/* Main Featured Image */}
            <div 
              className="col-span-3 relative overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openLightbox(0)}
            >
              <Image
                src={getImageUrl(hotel.images[0])}
                alt={`${hotel.name} main view`}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                priority
                onError={(e) => {
                  console.error(`Failed to load main image: ${hotel.images[0]}`);
                  // Set fallback image
                  e.currentTarget.src = '/assets/images/placeholder-hotel.jpg';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <EyeIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            
            {/* Side Gallery */}
            <div className="col-span-2 grid grid-rows-2 gap-2">
              {hotel.images.length > 1 && (
                <div 
                  className="relative overflow-hidden rounded-lg cursor-pointer group"
                  onClick={() => openLightbox(1)}
                >
                  <Image
                    src={getImageUrl(hotel.images[1])}
                    alt={`${hotel.name} view 2`}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      console.error(`Failed to load image 2: ${hotel.images[1]}`);
                      e.currentTarget.src = '/assets/images/placeholder-hotel.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <EyeIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
              
              {hotel.images.length > 2 ? (
                <div 
                  className="relative overflow-hidden rounded-lg cursor-pointer group"
                  onClick={() => openLightbox(2)}
                >
                  <Image
                    src={getImageUrl(hotel.images[2])}
                    alt={`${hotel.name} view 3`}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      console.error(`Failed to load image 3: ${hotel.images[2]}`);
                      e.currentTarget.src = '/assets/images/placeholder-hotel.jpg';
                    }}
                  />
                  {hotel.images.length > 3 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <span className="text-xl font-semibold">+{hotel.images.length - 3}</span>
                        <p className="text-sm">more photos</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No more images</span>
                </div>
              )}
            </div>
          </div>
          
          {/* View All Button */}
          {hotel.images.length > 3 && (
            <button 
              className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
              onClick={() => openLightbox(0)}
            >
              <EyeIcon className="h-4 w-4" />
              <span>View All</span>
            </button>
          )}
        </div>
      ) : (
        <div className="h-64 w-full rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <Image
            src="/assets/images/placeholder-hotel.jpg"
            alt="No hotel images available"
            width={600}
            height={400}
            className="h-full w-full object-cover rounded-lg"
          />
        </div>
      )}
      
      {/* Lightbox */}
      {hasValidImages() && (
        <ImageLightbox
          images={hotel.images.map((img: string) => getImageUrl(img))}
          isOpen={lightboxOpen}
          setIsOpen={setLightboxOpen}
          startIndex={lightboxIndex}
          title={hotel.name}
        />
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-300">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.roomCount}</span>
            <span className="text-sm text-blue-600 dark:text-blue-400">Room Types</span>
          </CardContent>
        </Card>
        
        <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-800/50 dark:text-emerald-300">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.physicalRoomCount}</span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">Physical Rooms</span>
          </CardContent>
        </Card>
        
        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:border-amber-800 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-800/50 dark:text-amber-300">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.bookingCount}</span>
            <span className="text-sm text-amber-600 dark:text-amber-400">Total Bookings</span>
          </CardContent>
        </Card>
        
        <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:border-indigo-800 dark:from-indigo-900/20 dark:to-indigo-800/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-800/50 dark:text-indigo-300">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(stats.revenue)}</span>
            <span className="text-sm text-indigo-600 dark:text-indigo-400">Total Revenue</span>
          </CardContent>
        </Card>
        
        <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-800/50 dark:text-purple-300">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.occupancyRate}%</span>
            <span className="text-sm text-purple-600 dark:text-purple-400">Occupancy Rate</span>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="mb-6 w-full rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <TabsTrigger 
            value="rooms" 
            className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
          >
            Rooms
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
          >
            Hotel Details
          </TabsTrigger>
          <TabsTrigger 
            value="amenities" 
            className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
          >
            Amenities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rooms">
          <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hotel Rooms</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage rooms, pricing, and availability
              </p>
            </div>
            <Link href={`/vendor/hotels/${hotelId}/rooms/create`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </Link>
          </div>
          
          <RoomList hotelId={hotelId} />
        </TabsContent>
        
        <TabsContent value="details" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
              <CardTitle>Hotel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p className="mt-1 text-gray-900 dark:text-white">{hotel.description}</p>
              </div>
              
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {hotel.address}<br />
                    {hotel.city}, {hotel.state}<br />
                    {hotel.country} {hotel.zipCode && `, ${hotel.zipCode}`}
                  </p>
                </div>
                
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    Phone: {hotel.phone}<br />
                    Email: {hotel.email}<br />
                    {hotel.website && <>Website: {hotel.website}</>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {hotel.whitelabelConfig && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Color</h3>
                  <div className="mt-2 flex items-center space-x-2">
                    <div 
                      className="h-8 w-8 rounded-full border border-gray-200 shadow-sm" 
                      style={{ backgroundColor: hotel.whitelabelConfig.primaryColor }}
                    />
                    <span className="font-mono text-sm">{hotel.whitelabelConfig.primaryColor}</span>
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Secondary Color</h3>
                  <div className="mt-2 flex items-center space-x-2">
                    <div 
                      className="h-8 w-8 rounded-full border border-gray-200 shadow-sm" 
                      style={{ backgroundColor: hotel.whitelabelConfig.secondaryColor }}
                    />
                    <span className="font-mono text-sm">{hotel.whitelabelConfig.secondaryColor}</span>
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Font Family</h3>
                  <p className="mt-2 font-medium text-gray-900 dark:text-white" style={{ fontFamily: hotel.whitelabelConfig.fontFamily }}>
                    {hotel.whitelabelConfig.fontFamily}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {hotel.wifiConfig && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                <CardTitle>WiFi Configuration</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                  <p className="mt-2">
                    {hotel.wifiConfig.isEnabled ? 
                      <Badge variant="success" className="mt-1">Enabled</Badge> : 
                      <Badge variant="secondary" className="mt-1">Disabled</Badge>
                    }
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Network Name</h3>
                  <p className="mt-2 font-medium text-gray-900 dark:text-white">
                    {hotel.wifiConfig.networkName || 'Not set'}
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bandwidth Limit</h3>
                  <p className="mt-2 font-medium text-gray-900 dark:text-white">
                    {hotel.wifiConfig.bandwidthLimit} Mbps
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="amenities">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
              <CardTitle>Hotel Amenities</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {hotel.amenities && hotel.amenities.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {hotel.amenities.map((amenity: any) => (
                    <div 
                      key={amenity.id} 
                      className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <span className="text-xl">{amenity.icon || '✓'}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{amenity.name}</h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{amenity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No amenities added yet</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Edit the hotel to add amenities
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}