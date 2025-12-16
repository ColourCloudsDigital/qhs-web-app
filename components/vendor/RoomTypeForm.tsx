'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import toast from '@/lib/toast';
import { Amenity, RoomTypeFormData } from '@/types/hotel';

interface RoomTypeFormProps {
  initialData: RoomTypeFormData;
  amenities: Amenity[];
  hotelId: string;
  isLoading: boolean;
  onSubmit: (data: RoomTypeFormData) => void;
  isEditMode?: boolean;
}

export function RoomTypeForm({
  initialData,
  amenities,
  hotelId,
  isLoading,
  onSubmit,
  isEditMode = false
}: RoomTypeFormProps) {
  const [formData, setFormData] = useState<RoomTypeFormData>(initialData);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData.amenities || []);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Validate the form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Room type name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (formData.basePrice <= 0) {
      errors.basePrice = 'Base price must be greater than 0';
    }
    
    if (formData.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
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
  
  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities(prev => [...prev, amenityId]);
    } else {
      setSelectedAmenities(prev => prev.filter(id => id !== amenityId));
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
    
    onSubmit(finalData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Room Type Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Room Type Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={validationErrors.name}
              helperText="E.g., Deluxe, Standard, Suite"
            />
            
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                error={validationErrors.description}
                helperText="Describe the features and benefits of this room type"
              />
            </div>
            
            <Input
              type="number"
              label="Base Price (₦)"
              id="basePrice"
              name="basePrice"
              value={formData.basePrice.toString()}
              onChange={handleChange}
              required
              min={0}
              step={0.01}
              error={validationErrors.basePrice}
              helperText="Standard price per night"
            />
            
            <Input
              type="number"
              label="Capacity (Guests)"
              id="capacity"
              name="capacity"
              value={formData.capacity.toString()}
              onChange={handleChange}
              required
              min={1}
              error={validationErrors.capacity}
              helperText="Maximum number of guests"
            />
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
          {amenities.length === 0 && (
            <p className="text-sm text-gray-500">No room amenities available. Contact an administrator to add amenities.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-3">
        <Link href={`/vendor/hotels/${hotelId}`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Saving...' : 'Create Room Type'}
            </>
          ) : (
            isEditMode ? 'Save Changes' : 'Create Room Type'
          )}
        </Button>
      </div>
    </form>
  );
}