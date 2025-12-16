'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { HotelForm } from '@/components/vendor/HotelForm';
import { Amenity } from '@/types/hotel';
import toast from '@/lib/toast';
import { Loader2 } from 'lucide-react';

interface EditHotelPageProps {
  params: {
    hotelId: string;
  };
}

export default function EditHotelPage({ params }: EditHotelPageProps) {
  const hotelId = params.hotelId;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  
  // Fetch hotel data when component mounts
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch hotel data
        const response = await fetch(`/api/vendor/hotels/${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hotel data');
        }
        
        const data = await response.json();
        setHotel(data.hotel);
        
        // Fetch amenities
        const amenitiesResponse = await fetch('/api/admin/amenities?type=HOTEL');
        if (amenitiesResponse.ok) {
          const amenitiesData = await amenitiesResponse.json();
          setAmenities(amenitiesData.amenities);
        } else {
          console.error('Failed to fetch amenities');
        }
      } catch (err) {
        console.error('Error fetching hotel data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hotel data');
        toast.error('Failed to load hotel data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHotelData();
  }, [hotelId]);
  
  const handleSubmit = async (data: any, images: string[]) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare hotel data
      const hotelData = {
        ...data,
        images: images,
        whitelabelConfig: {
          logo: data.logo ? '/assets/images/logo.png' : null, // Simplified
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: data.fontFamily,
        },
        wifiConfig: {
          networkName: data.networkName,
          isEnabled: data.wifiEnabled,
          bandwidthLimit: data.bandwidthLimit,
        },
      };
      
      // Remove rating field as vendors cannot update this
      delete hotelData.rating;
      
      const response = await fetch(`/api/vendor/hotels/${hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hotel');
      }
      
      toast.success('Hotel updated successfully');
      
      // Redirect back to hotel details page
      router.push(`/vendor/hotels/${hotelId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hotel');
      toast.error(err instanceof Error ? err.message : 'Failed to update hotel');
      console.error('Error updating hotel:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading hotel data...</p>
        </div>
      </div>
    );
  }
  
  if (!hotel) {
    return (
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Hotel not found or you don't have permission to edit it.</AlertDescription>
      </Alert>
    );
  }
  
  // Prepare form initial data
  const initialData = {
    name: hotel.name || '',
    description: hotel.description || '',
    address: hotel.address || '',
    city: hotel.city || '',
    state: hotel.state || '',
    country: hotel.country || '',
    zipCode: hotel.zipCode || '',
    phone: hotel.phone || '',
    email: hotel.email || '',
    website: hotel.website || '',
    amenities: hotel.amenities?.map((a: any) => a.amenityId) || [],
    logo: null, // This will be handled by the form component
    primaryColor: hotel.whitelabelConfig?.primaryColor || '#1e3a8a',
    secondaryColor: hotel.whitelabelConfig?.secondaryColor || '#f59e0b',
    fontFamily: hotel.whitelabelConfig?.fontFamily || 'Poppins, sans-serif',
    wifiEnabled: hotel.wifiConfig?.isEnabled || true,
    networkName: hotel.wifiConfig?.networkName || '',
    bandwidthLimit: hotel.wifiConfig?.bandwidthLimit || 10,
    isActive: hotel.isActive !== undefined ? hotel.isActive : true,
  };
  
  // Parse images if they are stored as a JSON string
  let existingImages: string[] = [];
  if (hotel.images) {
    try {
      existingImages = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
    } catch (error) {
      console.error('Error parsing hotel images:', error);
      existingImages = [];
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Hotel</h1>
        </div>
      </div>
      
      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <HotelForm
        initialData={initialData}
        amenities={amenities}
        existingImages={existingImages}
        isLoading={submitting}
        onSubmit={handleSubmit}
        isEditMode={true}
      />
    </div>
  );
}