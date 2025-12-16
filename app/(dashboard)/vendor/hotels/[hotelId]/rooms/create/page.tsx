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

interface CreateRoomPageProps {
  params: {
    hotelId: string;
  };
}

export default function CreateRoomPage({ params }: CreateRoomPageProps) {
  const hotelId = params.hotelId;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('');
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  
  // Default form data
  const defaultFormData = {
    name: '',
    type: 'standard',
    description: '',
    capacity: 2,
    pricePerNight: 0,
    discountedPrice: undefined,
    status: 'available',
    images: [],
    roomNumbers: [],
    amenities: [],
  };
  
  // Fetch hotel name and amenities when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch hotel data to get the name
        const hotelResponse = await fetch(`/api/vendor/hotels/${hotelId}`);
        if (!hotelResponse.ok) {
          throw new Error('Failed to fetch hotel data');
        }
        
        const hotelData = await hotelResponse.json();
        setHotelName(hotelData.hotel.name || 'Hotel');
        
        // Fetch room amenities
        const amenitiesResponse = await fetch('/api/admin/amenities?type=ROOM');
        if (amenitiesResponse.ok) {
          const amenitiesData = await amenitiesResponse.json();
          setAmenities(amenitiesData.amenities);
        } else {
          console.error('Failed to fetch amenities');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        toast.error('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [hotelId]);
  
  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare room data
      const roomData = {
        ...data,
        hotelId,
      };
      
      const response = await fetch('/api/vendor/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }
      
      toast.success('Room created successfully');
      
      // Redirect back to hotel details page
      router.push(`/vendor/hotels/${hotelId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      toast.error('Failed to create room');
      console.error('Error creating room:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Room</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hotelName ? `For ${hotelName}` : ''}
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
        initialData={defaultFormData}
        amenities={amenities}
        hotelId={hotelId}
        isLoading={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}