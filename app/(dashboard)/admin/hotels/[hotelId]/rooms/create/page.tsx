'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RoomForm } from '@/components/admin/rooms/RoomForm';
import toast from '@/lib/toast';
import { Loader2 } from 'lucide-react';

interface CreateRoomPageProps {
  params: {
    hotelId: string;
  };
}

interface RoomFormData {
  name: string;
  type: string;
  description: string;
  basePrice: string;
  capacity: string;
  bedsCount: string;
  bathroomsCount: string;
  size: string;
  images: string[];
  isActive: boolean;
  amenities: string[];
}

const defaultFormData: RoomFormData = {
  name: '',
  type: 'standard',
  description: '',
  capacity: '2',
  bedsCount: '1',
  bathroomsCount: '1',
  size: '',
  basePrice: '',
  images: [],
  isActive: true,
  amenities: [],
};

export default function CreateRoomPage({ params }: CreateRoomPageProps) {
  const hotelId = params.hotelId;
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelAmenities, setHotelAmenities] = useState<any[]>([]);
  const [hotelName, setHotelName] = useState<string>('');
  
  // Fetch hotel name and amenities when component mounts
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch hotel data
        const response = await fetch(`/api/admin/hotels/${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hotel data');
        }
        const { hotel } = await response.json();
        setHotelName(hotel?.name || 'Hotel');
        
        // Fetch amenities
        const amenitiesResponse = await fetch('/api/admin/amenities?type=ROOM');
        if (amenitiesResponse.ok) {
          const data = await amenitiesResponse.json();
          setHotelAmenities(data.amenities || []);
        } else {
          console.error('Failed to fetch amenities');
          toast.error('Failed to load room amenities');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again.');
        toast.error('Error loading data');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchHotelData();
  }, [hotelId]);
  
  const handleSubmit = async (data: RoomFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare room data
      const roomData = {
        ...data,
        hotelId: hotelId,
      };
      
      const response = await fetch('/api/admin/rooms', {
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
      
      // Redirect to the hotel details page
      router.push(`/admin/hotels/${hotelId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating room:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }
  
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Room</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hotelName ? `For ${hotelName}` : `Hotel ID: ${hotelId}`}
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
        hotelId={hotelId}
        hotelAmenities={hotelAmenities}
        onSubmit={handleSubmit}
        isSubmitting={loading}
      />
    </div>
  );
}