import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Form, FormActions } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { BasicInfoSection } from './BasicInfoSection';
import { HotelImagesUploader } from './HotelImagesUploader';
import { AmenitiesSection } from './AmenitiesSection';
import { WhitelabelSection } from './WhitelabelSection';
import { Amenity, Vendor, HotelFormData } from './types';

interface HotelFormProps {
  initialData: HotelFormData;
  vendors: Vendor[];
  amenities: Amenity[];
  existingImages: string[];
  hotelId?: string; // For edit mode
  isLoading: boolean;
  onSubmit: (data: HotelFormData, uploadedImages: string[]) => Promise<void>;
}

export function HotelForm({
  initialData,
  vendors,
  amenities,
  existingImages,
  hotelId,
  isLoading,
  onSubmit
}: HotelFormProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'SUPER_ADMIN';

  // If user is a vendor, set vendorId automatically
  const [formData, setFormData] = useState<HotelFormData>(() => {
    if (!isAdmin && session?.user?.vendorId) {
      // Auto-assign the current vendor's ID if not admin
      return {
        ...initialData,
        vendorId: session.user.vendorId
      };
    }
    return initialData;
  });
  
  const [currentImages, setCurrentImages] = useState<string[]>(existingImages);
  
  // Update vendorId if session changes
  useEffect(() => {
    if (!isAdmin && session?.user?.vendorId && !formData.vendorId) {
      setFormData(prev => ({
        ...prev,
        vendorId: session.user.vendorId as string
      }));
    }
  }, [session, isAdmin, formData.vendorId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'rating') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleVendorChange = (value: string) => {
    // Only allow vendor changes for admin
    if (isAdmin) {
      setFormData(prev => ({
        ...prev,
        vendorId: value,
      }));
    }
  };
  
  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          amenities: [...prev.amenities, amenityId],
        };
      } else {
        return {
          ...prev,
          amenities: prev.amenities.filter(id => id !== amenityId),
        };
      }
    });
  };
  
  const handleImagesChange = (newImages: string[]) => {
    setCurrentImages(newImages);
  };
  
  const handleLogoUpload = (logoUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      logo: logoUrl,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure vendorId is set for non-admin users
    const dataToSubmit = { 
      ...formData 
    };
    
    // If user is not an admin and has a vendorId, use that
    if (!isAdmin && session?.user?.vendorId) {
      dataToSubmit.vendorId = session.user.vendorId as string;
    }
    
    await onSubmit(dataToSubmit, currentImages);
  };
  
  // Validate that we have a vendorId before submitting
  const isFormValid = formData.vendorId && formData.name && formData.city && formData.country;
  
  return (
    <Form onSubmit={handleSubmit}>
      <BasicInfoSection 
        formData={formData}
        onInputChange={handleInputChange}
        onVendorChange={handleVendorChange}
        vendors={vendors}
      />
      
      <HotelImagesUploader
        existingImages={currentImages}
        hotelId={hotelId}
        onImagesChange={handleImagesChange}
      />
      
      <AmenitiesSection 
        amenities={amenities}
        selectedAmenities={formData.amenities}
        onAmenityChange={handleAmenityChange}
      />
      
      <WhitelabelSection 
        formData={formData}
        onInputChange={handleInputChange}
        onLogoUpload={handleLogoUpload}
        hotelId={hotelId}
      />
      
      <FormActions alignEnd className="-mb-4">
        <Link
          href={hotelId ? `/admin/hotels/${hotelId}` : '/admin/hotels'}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? 'Saving...' : (hotelId ? 'Save Changes' : 'Create Hotel')}
        </Button>
      </FormActions>
    </Form>
  );
}