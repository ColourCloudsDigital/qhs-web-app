'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import Link from 'next/link';
import toast from '@/lib/toast';
import { Amenity } from '@/types/hotel';

interface HotelFormData {
  id?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  amenities: string[];
  logo: File | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  isActive: boolean;
}

interface HotelFormProps {
  initialData: HotelFormData;
  amenities: Amenity[];
  existingImages: string[];
  isLoading: boolean;
  onSubmit: (data: HotelFormData, images: string[]) => void;
  isEditMode?: boolean;
}

export function HotelForm({
  initialData,
  amenities,
  existingImages,
  isLoading,
  onSubmit,
  isEditMode = false
}: HotelFormProps) {
  const [formData, setFormData] = useState<HotelFormData>(initialData);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData.amenities || []);
  const [images, setImages] = useState<string[]>(existingImages || []);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
    setSelectedAmenities(initialData.amenities || []);
    setImages(existingImages || []);
  }, [initialData, existingImages]);
  
  // Validate the form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Hotel name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (images.length === 0) {
      errors.images = 'At least one hotel image is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error when field is modified
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is modified
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities(prev => [...prev, amenityId]);
    } else {
      setSelectedAmenities(prev => prev.filter(id => id !== amenityId));
    }
  };
  
  const handleImageUpload = (newImages: string[]) => {
    setImages(newImages);
    
    // Clear validation error for images
    if (validationErrors.images) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Show toast for validation errors
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || 'Please fix the validation errors');
      return;
    }
    
    const finalData = {
      ...formData,
      amenities: selectedAmenities,
    };
    
    onSubmit(finalData, images);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Hotel Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={validationErrors.name}
            />
            
            <Input
              label="Email"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={validationErrors.email}
            />
            
            <Textarea
              label="Description"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              error={validationErrors.description}
              className="md:col-span-2"
            />
            
            <Checkbox 
              id="isActive"
              label="Active Hotel"
              checked={formData.isActive}
              onChange={(checked) => handleCheckboxChange('isActive', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Location & Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Address"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              error={validationErrors.address}
            />
            
            <Input
              label="City"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              error={validationErrors.city}
            />
            
            <Input
              label="State"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              error={validationErrors.state}
            />
            
            <Input
              label="Country"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              error={validationErrors.country}
            />
            
            <Input
              label="ZIP Code"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              error={validationErrors.zipCode}
            />
            
            <Input
              label="Phone"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              error={validationErrors.phone}
            />
            
            <Input
              label="Website"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              error={validationErrors.website}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Primary Color"
              type="color"
              id="primaryColor"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
            />
            
            <Input
              label="Secondary Color"
              type="color"
              id="secondaryColor"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
            />
            
            <div className="space-y-2">
              <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Family
              </label>
              <Select
                value={formData.fontFamily}
                onValueChange={(value) => handleSelectChange('fontFamily', value)}
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue placeholder="Select a font family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                  <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                  <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                  <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                  <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <input
                type="file"
                id="logo"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    // In a real app, you would handle file upload here
                    setFormData(prev => ({
                      ...prev,
                      logo: e.target.files ? e.target.files[0] : null
                    }));
                  }
                }}
              />
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Logo (Optional)
              </label>
              <div className="mt-1 flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo')?.click()}
                >
                  {formData.logo ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {formData.logo && (
                  <span className="ml-2 text-sm text-gray-500">
                    {formData.logo instanceof File ? formData.logo.name : 'Logo uploaded'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="flex items-start space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={selectedAmenities.includes(amenity.id)}
                  onChange={(checked) => handleAmenityChange(amenity.id, checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`amenity-${amenity.id}`}
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {amenity.name}
                  </label>
                  <p className="text-xs text-gray-500">{amenity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiImageUploader
            images={images}
            onImagesChange={handleImageUpload}
            maxImages={10}
            uploadDir="hotels"
            label={validationErrors.images ? `Hotel Images (${validationErrors.images})` : "Hotel Images"}
            description="Upload up to 10 images of your hotel. The first image will be used as the main image."
            aspectRatio="landscape"
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-3">
        <Link href={isEditMode ? `/vendor/hotels/${initialData.id}` : "/vendor/hotels"}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            isEditMode ? 'Save Changes' : 'Create Hotel'
          )}
        </Button>
      </div>
    </form>
  );
}