'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RoomForm } from '@/components/vendor/RoomForm';
import { Amenity } from '@/types/hotel';
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
  id?: string;
  name: string;
  type: string;
  description: string;
  pricePerNight?: number;
  basePrice?: number;
  capacity?: number;
  discountedPrice?: number;
  status?: string;
  isActive?: boolean;
  images: string[];
  roomNumbers?: string[];
  amenities: string[];
  bedType?: string;
  bedsCount?: number;
  bathroomsCount?: number;
  size?: string;
  roomTypeId?: string;
}

export default function EditRoomPage({ params }: EditRoomPageProps) {
  const { hotelId, roomId } = params;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('');
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [room, setRoom] = useState<any>(null);
  
  // Fetch room data, hotel name, and amenities when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[VENDOR ROOM EDIT] Starting data fetch for roomId:', roomId);
        
        // Fetch room data
        console.log('[VENDOR ROOM EDIT] Fetching room data from API endpoint');
        const roomResponse = await fetch(`/api/vendor/rooms/${roomId}`);
        console.log('[VENDOR ROOM EDIT] Room API response status:', roomResponse.status);
        
        if (!roomResponse.ok) {
          const errorData = await roomResponse.json();
          console.error('[VENDOR ROOM EDIT] Room API error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch room data');
        }
        
        const roomData = await roomResponse.json();
        console.log('[VENDOR ROOM EDIT] Room API raw response:', JSON.stringify(roomData));
        
        console.log('[VENDOR ROOM EDIT] Room data structure:', {
          id: roomData.room?.id,
          name: roomData.room?.name,
          type: roomData.room?.type,
          basePrice: roomData.room?.basePrice,
          pricePerNight: roomData.room?.pricePerNight,
          capacity: roomData.room?.capacity,
          status: roomData.room?.status,
          isActive: roomData.room?.isActive,
          roomTypeId: roomData.room?.roomTypeId,
          dataTypes: {
            images: typeof roomData.room?.images,
            roomNumbers: typeof roomData.room?.roomNumbers,
            amenities: typeof roomData.room?.amenities,
          }
        });
        
        setRoom(roomData.room);
        
        // Fetch hotel data to get the name
        console.log('[VENDOR ROOM EDIT] Fetching hotel data');
        const hotelResponse = await fetch(`/api/vendor/hotels/${hotelId}`);
        console.log('[VENDOR ROOM EDIT] Hotel API response status:', hotelResponse.status);
        
        if (hotelResponse.ok) {
          const hotelData = await hotelResponse.json();
          console.log('[VENDOR ROOM EDIT] Hotel name:', hotelData.hotel?.name);
          setHotelName(hotelData.hotel?.name || 'Hotel');
        } else {
          console.warn('[VENDOR ROOM EDIT] Failed to fetch hotel data:', hotelResponse.status);
        }
        
        // Fetch room amenities
        console.log('[VENDOR ROOM EDIT] Fetching amenities data');
        const amenitiesResponse = await fetch('/api/admin/amenities?type=ROOM');
        console.log('[VENDOR ROOM EDIT] Amenities API response status:', amenitiesResponse.status);
        
        if (amenitiesResponse.ok) {
          const amenitiesData = await amenitiesResponse.json();
          console.log('[VENDOR ROOM EDIT] Amenities count:', amenitiesData.amenities?.length || 0);
          setAmenities(amenitiesData.amenities);
        } else {
          console.error('[VENDOR ROOM EDIT] Failed to fetch amenities:', amenitiesResponse.status);
        }
      } catch (err) {
        console.error('[VENDOR ROOM EDIT] Error in data fetching:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        toast.error('Failed to load required data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
        console.log('[VENDOR ROOM EDIT] Data loading complete');
      }
    };
    
    fetchData();
  }, [hotelId, roomId]);
  
  // Handle form submission
  const handleSubmit = async (data: RoomFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      console.log('[VENDOR ROOM EDIT] Submitting form data:', JSON.stringify(data));
      console.log('[VENDOR ROOM EDIT] Data types:', {
        bedsCount: typeof data.bedsCount, 
        bathroomsCount: typeof data.bathroomsCount,
        size: typeof data.size,
        roomNumbers: Array.isArray(data.roomNumbers) ? 'array' : typeof data.roomNumbers,
        amenities: Array.isArray(data.amenities) ? 'array' : typeof data.amenities,
      });
      
      // Prepare room data - ensure all fields are properly formatted
      const roomData = {
        ...data,
        hotelId,
        // Ensure numeric fields are numbers not strings
        pricePerNight: typeof data.pricePerNight === 'string' ? parseFloat(data.pricePerNight) : data.pricePerNight,
        basePrice: typeof data.basePrice === 'string' ? parseFloat(data.basePrice) : data.basePrice,
        capacity: typeof data.capacity === 'string' ? parseInt(data.capacity as string) : data.capacity,
        bedsCount: typeof data.bedsCount === 'string' ? parseInt(data.bedsCount) : data.bedsCount,
        bathroomsCount: typeof data.bathroomsCount === 'string' ? parseFloat(data.bathroomsCount as string) : data.bathroomsCount,
        size: data.size ? (typeof data.size === 'string' && data.size.trim() !== '' ? data.size : undefined) : undefined,
        // Ensure status and isActive are consistent
        status: data.isActive ? 'AVAILABLE' : 'INACTIVE',
        isActive: data.isActive
      };
      
      // Debug info about the processed data
      console.log('[VENDOR ROOM EDIT] Processed submission data:', JSON.stringify(roomData));
      console.log('[VENDOR ROOM EDIT] Processed data types:', {
        bedsCount: typeof roomData.bedsCount, 
        bathroomsCount: typeof roomData.bathroomsCount,
        size: typeof roomData.size, 
        roomNumbers: Array.isArray(roomData.roomNumbers) ? `Array[${roomData.roomNumbers.length}]` : typeof roomData.roomNumbers,
        amenities: Array.isArray(roomData.amenities) ? `Array[${roomData.amenities.length}]` : typeof roomData.amenities,
      });
      
      console.log('[VENDOR ROOM EDIT] Sending update request to API');
      const response = await fetch(`/api/vendor/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      console.log('[VENDOR ROOM EDIT] API response status:', response.status);
      
      // Try to get the response body whether it succeeded or failed
      const responseText = await response.text();
      console.log('[VENDOR ROOM EDIT] API response body (raw):', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('[VENDOR ROOM EDIT] API response data (parsed):', responseData);
      } catch (e) {
        console.error('[VENDOR ROOM EDIT] Failed to parse response as JSON:', e);
      }
      
      if (!response.ok) {
        console.error('[VENDOR ROOM EDIT] API error response:', responseData || responseText);
        throw new Error((responseData?.error) || 'Failed to update room');
      }
      
      toast.success('Room updated successfully');
      
      // Redirect back to hotel details page
      console.log('[VENDOR ROOM EDIT] Redirecting to room page');
      router.push(`/vendor/hotels/${hotelId}/rooms/${roomId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room';
      console.error('[VENDOR ROOM EDIT] Submission error:', errorMessage);
      if (err instanceof Error && err.stack) {
        console.error('[VENDOR ROOM EDIT] Error stack:', err.stack);
      }
      setError(errorMessage);
      toast.error('Failed to update room: ' + errorMessage);
    } finally {
      setSubmitting(false);
      console.log('[VENDOR ROOM EDIT] Form submission complete');
    }
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
  
  if (!room) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Room not found or you don't have permission to edit it.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link 
            href={`/vendor/hotels/${hotelId}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Hotel
          </Link>
        </div>
      </div>
    );
  }
  
  // Prepare initial form data from room, handling all possible field variations
  const prepareFormData = (room: any): RoomFormData => {
    console.log('[VENDOR ROOM EDIT] Preparing initial form data');
    
    // Parse JSON fields if needed
    let parsedImages = room.images;
    if (typeof room.images === 'string') {
      try {
        console.log('[VENDOR ROOM EDIT] Parsing images from string');
        parsedImages = JSON.parse(room.images);
        console.log('[VENDOR ROOM EDIT] Images parsed successfully, count:', parsedImages.length);
      } catch (e) {
        console.error('[VENDOR ROOM EDIT] Error parsing images:', e);
        parsedImages = [];
      }
    } else if (!Array.isArray(room.images)) {
      console.log('[VENDOR ROOM EDIT] Images not an array or string, defaulting to empty array');
      parsedImages = [];
    }
    
    let parsedRoomNumbers = room.roomNumbers;
    if (typeof room.roomNumbers === 'string') {
      try {
        console.log('[VENDOR ROOM EDIT] Parsing roomNumbers from string');
        parsedRoomNumbers = JSON.parse(room.roomNumbers);
        console.log('[VENDOR ROOM EDIT] Room numbers parsed successfully, count:', parsedRoomNumbers.length);
      } catch (e) {
        console.error('[VENDOR ROOM EDIT] Error parsing roomNumbers:', e);
        parsedRoomNumbers = [];
      }
    } else if (!Array.isArray(room.roomNumbers)) {
      console.log('[VENDOR ROOM EDIT] Room numbers not an array or string, defaulting to empty array');
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
          console.log('[VENDOR ROOM EDIT] Unexpected amenity format:', a);
          return null;
        }).filter(Boolean);
        console.log('[VENDOR ROOM EDIT] Processed amenities count:', parsedAmenities.length);
      } else {
        console.warn('[VENDOR ROOM EDIT] Amenities not an array:', typeof room.amenities);
      }
    } else {
      console.log('[VENDOR ROOM EDIT] No amenities data found');
    }
    
    // Create the form data object
    const formData: RoomFormData = {
      id: room.id,
      name: room.name || '',
      type: room.type || 'standard',
      description: room.description || '',
      // Handle price field variations
      pricePerNight: room.pricePerNight || room.basePrice || 0,
      basePrice: room.basePrice || room.pricePerNight || 0,
      capacity: room.capacity || 2,
      discountedPrice: room.discountedPrice,
      // Handle status/isActive field variations
      status: room.status || (room.isActive ? 'AVAILABLE' : 'INACTIVE'),
      isActive: room.isActive !== undefined ? room.isActive : 
                (room.status?.toLowerCase() === 'available' || room.status?.toLowerCase() === 'active'),
      // Use parsed data
      images: parsedImages,
      roomNumbers: parsedRoomNumbers,
      amenities: parsedAmenities,
      // Additional fields
      bedType: room.bedType || 'King',
      bedsCount: room.bedsCount || 1,
      bathroomsCount: room.bathroomsCount || 1,
      size: room.size || '',
      roomTypeId: room.roomTypeId || ''
    };
    
    console.log('[VENDOR ROOM EDIT] Prepared form data:', JSON.stringify(formData));
    return formData;
  };
  
  const initialFormData = prepareFormData(room);
  
  console.log('[VENDOR ROOM EDIT] Final form data for vendor form:', JSON.stringify(initialFormData));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/vendor/hotels/${hotelId}/rooms/${roomId}`} 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Room</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {room.name} {hotelName ? `- ${hotelName}` : ''}
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
      
      <RoomForm
        initialData={initialFormData}
        amenities={amenities}
        hotelId={hotelId}
        isLoading={submitting}
        onSubmit={handleSubmit}
        isEditMode={true}
      />
    </div>
  );
}