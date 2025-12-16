'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { HotelForm } from '@/components/admin/hotels/HotelForm';
import { Amenity, Vendor, HotelFormData } from '@/components/admin/hotels/types';

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
  wifiEnabled: true,
  networkName: '',
  bandwidthLimit: 10,
  isActive: true,
};


export default function CreateHotelPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  
  // Fetch vendors and amenities when component mounts
  useEffect(() => {
    fetchVendors();
    fetchAmenities();
  }, []);
  
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
      
      const response = await fetch('/api/admin/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hotel');
      }
      
      const { hotel } = await response.json();
      
      // Redirect to the new hotel details page
      router.push(`/admin/hotels/${hotel.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hotel');
      console.error('Error creating hotel:', err);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Hotel</h1>
        </div>
      </div>
      
      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <HotelForm
        initialData={defaultFormData}
        vendors={vendors}
        amenities={amenities}
        existingImages={[]}
        isLoading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}