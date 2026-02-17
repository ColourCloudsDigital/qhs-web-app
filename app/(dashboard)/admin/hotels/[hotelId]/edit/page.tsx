'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { HotelForm } from '@/components/admin/hotels/HotelForm';
import { Amenity, Vendor, HotelFormData, HotelData } from '@/components/admin/hotels/types';

interface HotelEditPageProps {
  params: {
    hotelId: string;
  };
}

const defaultFormData: HotelFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  phone: '',
  email: '',
  website: '',
  rating: 0,
  vendorId: '',
  amenities: [],
  logo: null,
  primaryColor: '#1e3a8a',
  secondaryColor: '#f59e0b',
  fontFamily: 'Poppins, sans-serif',
  isActive: true, // Default to active
};


export default function EditHotelPage({ params }: HotelEditPageProps) {
  const hotelId = params.hotelId;
  const router = useRouter();
  
  const [formData, setFormData] = useState<HotelFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // Fetch hotel data, vendors, and amenities when component mounts
  useEffect(() => {
    fetchHotelData();
    fetchVendors();
    fetchAmenities();
  }, []);
  
  const fetchHotelData = async () => {
    try {
      setIsDataLoading(true);
      
      const response = await fetch(`/api/admin/hotels/${hotelId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotel data');
      }
      
      const { hotel } = await response.json();
      
      // Set existing images
      setExistingImages(hotel.images || []);
      
      setFormData({
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
        rating: hotel.rating || 0,
        vendorId: hotel.vendor?.id || '',
        amenities: hotel.amenities?.map((a: any) => a.id) || [],
        // Whitelabel config
        logo: hotel.whitelabelConfig?.logo || null,
        primaryColor: hotel.whitelabelConfig?.primaryColor || '#1e3a8a',
        secondaryColor: hotel.whitelabelConfig?.secondaryColor || '#f59e0b',
        fontFamily: hotel.whitelabelConfig?.fontFamily || 'Poppins, sans-serif',
        // Add isActive field
        isActive: hotel.isActive !== undefined ? hotel.isActive : true,
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel data');
      console.error('Error fetching hotel:', err);
    } finally {
      setIsDataLoading(false);
    }
  };
  
  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors?simple=true');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors);
      } else {
        console.error('Failed to fetch vendors');
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };
  
  const fetchAmenities = async () => {
    try {
      const response = await fetch('/api/admin/amenities?type=HOTEL');
      if (response.ok) {
        const data = await response.json();
        setAmenities(data.amenities);
      } else {
        console.error('Failed to fetch amenities');
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
    }
  };
  
  const handleSubmit = async (data: HotelFormData, images: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare hotel data
      const hotelData = {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        rating: data.rating,
        vendorId: data.vendorId,
        amenities: data.amenities,
        isActive: data.isActive,
        images: images, // Combined existing and new images
        whitelabelConfig: {
          logo: data.logo, // Use data.logo, not formData.logo
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: data.fontFamily,
        },
      };
      
      console.log('Sending hotel data:', JSON.stringify(hotelData));
    
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
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
      
     // Redirect to the hotel details page
     router.push(`/admin/hotels/${hotelId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hotel');
      console.error('Error updating hotel:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (isDataLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading hotel data...</p>
        </div>
      </div>
    );
  }
  
  if (error && isDataLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Hotel</h1>
        </div>
      </div>
      
      {error && !isDataLoading && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <HotelForm
        initialData={formData}
        vendors={vendors}
        amenities={amenities}
        existingImages={existingImages}
        hotelId={hotelId}
        isLoading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}