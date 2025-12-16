'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RoomForm } from '@/components/admin/rooms/RoomForm';
import toast from '@/lib/toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditRoomPageProps {
  params: {
    hotelId: string;
    roomId: string;
  };
}

interface RoomFormData {
  name: string;
  type: string;
  description: string;
  basePrice: string;
  pricePerNight?: string;
  capacity: string;
  bedType: string;
  bedsCount?: string;
  bathroomsCount?: string;
  size?: string;
  images: string[];
  isActive: boolean;
  status?: string;
  amenities: string[];
  roomTypeId?: string;
  roomNumbers?: string[];
}

export default function EditRoomPage({ params }: EditRoomPageProps) {
  const hotelId = params.hotelId;
  const roomId = params.roomId;
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelAmenities, setHotelAmenities] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<RoomFormData | null>(null);
  
  // Fetch room data and amenities when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        console.log('[ADMIN ROOM EDIT] Starting data fetch for roomId:', roomId);
        
        // Fetch room data
        console.log('[ADMIN ROOM EDIT] Fetching room data from API endpoint');
        const roomResponse = await fetch(`/api/admin/rooms/${roomId}`);
        console.log('[ADMIN ROOM EDIT] Room API response status:', roomResponse.status);
        
        if (!roomResponse.ok) {
          const errorData = await roomResponse.json();
          console.error('[ADMIN ROOM EDIT] Room API error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch room data');
        }
        
        const responseData = await roomResponse.json();
        console.log('[ADMIN ROOM EDIT] Room API raw response:', JSON.stringify(responseData));
        
        const { room } = responseData;
        console.log('[ADMIN ROOM EDIT] Room data structure:', {
          id: room.id,
          name: room.name,
          type: room.type,
          basePrice: room.basePrice,
          pricePerNight: room.pricePerNight,
          capacity: room.capacity,
          status: room.status,
          isActive: room.isActive,
          roomTypeId: room.roomTypeId,
          dataTypes: {
            images: typeof room.images,
            roomNumbers: typeof room.roomNumbers,
            amenities: typeof room.amenities,
          }
        });
        
        // Fetch amenities
        console.log('[ADMIN ROOM EDIT] Fetching amenities data');
        const amenitiesResponse = await fetch('/api/admin/amenities?type=ROOM');
        if (!amenitiesResponse.ok) {
          console.error('[ADMIN ROOM EDIT] Failed to fetch amenities:', amenitiesResponse.status);
          throw new Error('Failed to fetch amenities');
        }
        
        const { amenities } = await amenitiesResponse.json();
        console.log('[ADMIN ROOM EDIT] Amenities count:', amenities?.length || 0);
        setHotelAmenities(amenities || []);
        
        // Transform the room data to match our form structure
        // Handle all possible field variations
        console.log('[ADMIN ROOM EDIT] Beginning data transformation');
        
        // Parse JSON fields if needed
        let parsedImages = room.images;
        if (typeof room.images === 'string') {
          try {
            console.log('[ADMIN ROOM EDIT] Parsing images from string');
            parsedImages = JSON.parse(room.images);
            console.log('[ADMIN ROOM EDIT] Images parsed successfully, count:', parsedImages.length);
          } catch (e) {
            console.error('[ADMIN ROOM EDIT] Error parsing images:', e);
            parsedImages = [];
          }
        } else if (!Array.isArray(room.images)) {
          console.log('[ADMIN ROOM EDIT] Images not an array or string, defaulting to empty array');
          parsedImages = [];
        }
        
        let parsedRoomNumbers = room.roomNumbers;
        if (typeof room.roomNumbers === 'string') {
          try {
            console.log('[ADMIN ROOM EDIT] Parsing roomNumbers from string');
            parsedRoomNumbers = JSON.parse(room.roomNumbers);
            console.log('[ADMIN ROOM EDIT] Room numbers parsed successfully, count:', parsedRoomNumbers.length);
          } catch (e) {
            console.error('[ADMIN ROOM EDIT] Error parsing roomNumbers:', e);
            parsedRoomNumbers = [];
          }
        } else if (!Array.isArray(room.roomNumbers)) {
          console.log('[ADMIN ROOM EDIT] Room numbers not an array or string, defaulting to empty array');
          parsedRoomNumbers = [];
        }
        
        // Handle amenities parsing
        let parsedAmenities = [];
        if (room.amenities) {
          if (Array.isArray(room.amenities)) {
            parsedAmenities = room.amenities.map((a: any) => {
              if (typeof a === 'string') return a;
              if (a && a.id) return a.id;
              if (a && a.amenityId) return a.amenityId;
              console.log('[ADMIN ROOM EDIT] Unexpected amenity format:', a);
              return null;
            }).filter(Boolean);
            console.log('[ADMIN ROOM EDIT] Processed amenities count:', parsedAmenities.length);
          } else {
            console.warn('[ADMIN ROOM EDIT] Amenities not an array:', typeof room.amenities);
          }
        } else {
          console.log('[ADMIN ROOM EDIT] No amenities data found');
        }
        
        const transformedData: RoomFormData = {
          name: room.name || '',
          type: room.type || 'standard',
          description: room.description || '',
          // Handle price field variations
          basePrice: (room.basePrice?.toString() || room.pricePerNight?.toString() || '0'),
          pricePerNight: (room.pricePerNight?.toString() || room.basePrice?.toString() || '0'),
          // Handle capacity field
          capacity: (room.capacity?.toString() || '2'),
          // Handle bed related fields
          bedType: room.bedType || 'King',
          bedsCount: room.bedsCount?.toString() || '1',
          bathroomsCount: room.bathroomsCount?.toString() || '1',
          size: room.size?.toString() || '',
          // Use parsed images
          images: parsedImages,
          // Handle status/isActive field variations
          isActive: room.isActive !== undefined ? room.isActive : 
                   (room.status?.toLowerCase() === 'available' || 
                    room.status?.toLowerCase() === 'active'),
          status: room.status || (room.isActive ? 'AVAILABLE' : 'INACTIVE'),
          // Use parsed amenities
          amenities: parsedAmenities,
          // Handle room type ID
          roomTypeId: room.roomTypeId || room.type || '',
          // Use parsed room numbers
          roomNumbers: parsedRoomNumbers
        };
        
        console.log('[ADMIN ROOM EDIT] Transformed data complete:', JSON.stringify(transformedData));
        setRoomData(transformedData);
        setError(null);
      } catch (err) {
        console.error('[ADMIN ROOM EDIT] Error in data fetching:', err);
        setError(err instanceof Error ? err.message : 'Failed to load required data');
        toast.error('Error loading data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setIsLoadingData(false);
        console.log('[ADMIN ROOM EDIT] Data loading complete');
      }
    };
    
    fetchData();
  }, [roomId]);
  
  const handleSubmit = async (data: RoomFormData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ADMIN ROOM EDIT] Submitting form data:', JSON.stringify(data));
      
      // Prepare room data
      const roomData = {
        ...data,
        hotelId: hotelId,
        // Ensure numeric fields are numbers not strings
        basePrice: parseFloat(data.basePrice),
        pricePerNight: parseFloat(data.basePrice),
        capacity: parseInt(data.capacity),
        bedsCount: data.bedsCount ? parseInt(data.bedsCount) : undefined,
        bathroomsCount: data.bathroomsCount ? parseFloat(data.bathroomsCount) : undefined,
        // Ensure status and isActive are consistent
        status: data.isActive ? 'AVAILABLE' : 'INACTIVE',
        isActive: data.isActive
      };
      
      console.log('[ADMIN ROOM EDIT] Processed submission data:', JSON.stringify(roomData));
      
      console.log('[ADMIN ROOM EDIT] Sending update request to API');
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      console.log('[ADMIN ROOM EDIT] API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ADMIN ROOM EDIT] API error response:', errorData);
        throw new Error(errorData.error || 'Failed to update room');
      }
      
      const result = await response.json();
      console.log('[ADMIN ROOM EDIT] API success response:', result);
      
      toast.success('Room updated successfully');
      
      // Redirect to the hotel details page
      console.log('[ADMIN ROOM EDIT] Redirecting to hotel page');
      router.push(`/admin/hotels/${hotelId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room';
      console.error('[ADMIN ROOM EDIT] Submission error:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('[ADMIN ROOM EDIT] Form submission complete');
    }
  };
  
  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading room data...</p>
        </div>
      </div>
    );
  }
  
  // Show error state if data failed to load
  if (error && !roomData) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Alert variant="error" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load room data'}</AlertDescription>
        </Alert>
        <div className="flex space-x-3">
          <Link 
            href={`/admin/hotels/${hotelId}`} 
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Hotel
          </Link>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/admin/hotels/${hotelId}/rooms/${roomId}`}
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Room</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {roomData?.name || 'Room'}
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {roomData && (
        <RoomForm
          initialData={roomData}
          hotelId={hotelId}
          roomId={roomId}
          hotelAmenities={hotelAmenities}
          onSubmit={handleSubmit}
          isSubmitting={loading}
        />
      )}
    </div>
  );
}