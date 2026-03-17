'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  isActive: true,
};

export default function VendorCreateHotelPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const response = await fetch('/api/admin/amenities?type=HOTEL');
      if (response.ok) {
        const data = await response.json();
        setAmenities(data.amenities || []);
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
    }
  };

  const handleSubmit = async (data: HotelFormData, images: string[]) => {
    try {
      setLoading(true);
      setError(null);

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
        vendorId: session?.user?.vendorId || data.vendorId,
        amenities: data.amenities,
        images,
        whitelabelConfig: {
          logo: data.logo ? '/assets/images/logo.png' : null,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: data.fontFamily,
        },
      };

      const response = await fetch('/api/vendor/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hotel');
      }

      const { hotel } = await response.json();
      router.push(`/vendor/hotels/${hotel.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/vendor/hotels"
          className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Hotel</h1>
      </div>

      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <HotelForm
        initialData={{
          ...defaultFormData,
          vendorId: session?.user?.vendorId || '',
        }}
        vendors={[]}
        amenities={amenities}
        existingImages={[]}
        isLoading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
