'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { FormRow, FormField, Form } from '@/components/ui/form';
import { FormSection } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RoomImagesUploader } from '@/components/admin/hotels/RoomImagesUploader';
import { HotelAmenitySelector } from '../hotels/HotelAmenitySelector';

interface Amenity {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
}

interface RoomFormData {
  name: string;
  type: string;
  description: string;
  basePrice: string;
  pricePerNight?: string;
  capacity: string;
  bedType: string;
  images: string[];
  isActive: boolean;
  status?: string;
  amenities: string[];
  roomTypeId?: string;
  bedsCount?: string;
  bathroomsCount?: string;
  size?: string;
  roomNumbers?: string[];
}

interface RoomFormProps {
  initialData?: RoomFormData;
  hotelId: string;
  roomId?: string;
  hotelAmenities: Amenity[];
  onSubmit: (data: RoomFormData) => void;
  isSubmitting?: boolean;
}

export function RoomForm({
  initialData,
  hotelId,
  roomId,
  hotelAmenities,
  onSubmit,
  isSubmitting = false,
}: RoomFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [basePrice, setBasePrice] = useState(
    initialData?.basePrice || initialData?.pricePerNight || ''
  );
  const [capacity, setCapacity] = useState(initialData?.capacity || '1');
  const [bedType, setBedType] = useState(initialData?.bedType || 'King');
  const [bedsCount, setBedsCount] = useState(initialData?.bedsCount || '1');
  const [bathroomsCount, setBathroomsCount] = useState(initialData?.bathroomsCount || '1');
  const [size, setSize] = useState(initialData?.size || '');
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData?.images || []
  );
  const [isActive, setIsActive] = useState(() => {
    if (initialData?.isActive !== undefined) {
      return initialData.isActive;
    }
    if (initialData?.status) {
      return initialData.status.toLowerCase() === 'available' || 
             initialData.status.toLowerCase() === 'active';
    }
    return true;
  });
  const [amenities, setAmenities] = useState<string[]>(
    initialData?.amenities || []
  );
  const [roomTypeId, setRoomTypeId] = useState(initialData?.roomTypeId || '');
  const [roomNumbers, setRoomNumbers] = useState<string[]>(
    initialData?.roomNumbers || []
  );

  useEffect(() => {
    if (initialData) {
      console.log('Initial Room Data:', {
        name: initialData.name,
        type: initialData.type,
        price: initialData.basePrice || initialData.pricePerNight,
        status: initialData.status,
        isActive: initialData.isActive,
        bedType: initialData.bedType,
        imagesCount: initialData.images?.length
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !description || !basePrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (existingImages.length === 0) {
      toast.error('Please upload at least one room image');
      return;
    }

    const formattedData: RoomFormData = {
      name,
      type,
      description,
      basePrice,
      pricePerNight: basePrice,
      capacity,
      bedType,
      bedsCount,
      bathroomsCount,
      size,
      images: existingImages,
      isActive,
      status: isActive ? 'AVAILABLE' : 'INACTIVE',
      amenities,
      roomTypeId: roomTypeId || undefined,
      roomNumbers
    };

    onSubmit(formattedData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormSection title="Basic Information">
        <FormRow>
          <FormField
            label="Room Name"
            required
            helperText="Enter a descriptive name for the room"
          >
            <Input
              id="name"
              placeholder="Deluxe King Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField
            label="Room Type"
            required
            helperText="Select the type of room"
          >
            <Select value={type} onValueChange={(value) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="accessible">Accessible</SelectItem>
                <SelectItem value="connecting">Connecting</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="bungalow">Bungalow</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </FormRow>

        <FormField
          label="Description"
          required
          helperText="Provide a detailed description of the room"
        >
          <Textarea
            id="description"
            placeholder="Enter room description with details on amenities, view, and unique features"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
          />
        </FormField>
      </FormSection>

      <FormSection title="Pricing & Availability">
        <FormRow>
          <FormField
            label="Price per Night"
            required
            helperText="Set the standard nightly rate for this room (in USD)"
          >
            <Input
              id="basePrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="99.99"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
          </FormField>

          <FormField
            label="Room Status"
            helperText="Toggle whether this room is available for booking"
          >
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {isActive ? 'Active' : 'Inactive'}
              </label>
            </div>
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Room Details">
        <FormRow>
          <FormField
            label="Maximum Capacity"
            helperText="Maximum number of guests allowed"
          >
            <Select value={capacity} onValueChange={(value) => setCapacity(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Person</SelectItem>
                <SelectItem value="2">2 People</SelectItem>
                <SelectItem value="3">3 People</SelectItem>
                <SelectItem value="4">4 People</SelectItem>
                <SelectItem value="5">5 People</SelectItem>
                <SelectItem value="6">6 People</SelectItem>
                <SelectItem value="7">7 People</SelectItem>
                <SelectItem value="8">8 People</SelectItem>
                <SelectItem value="9">9 People</SelectItem>
                <SelectItem value="10+">10+ People</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Bed Type" helperText="Type of bed in the room">
            <Select value={bedType} onValueChange={(value) => setBedType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bed type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="King">King</SelectItem>
                <SelectItem value="Queen">Queen</SelectItem>
                <SelectItem value="Twin">Twin</SelectItem>
                <SelectItem value="Full">Full</SelectItem>
                <SelectItem value="Double">Double</SelectItem>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Couch">Couch</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Number of Beds" helperText="How many beds in the room">
            <Select value={bedsCount} onValueChange={(value) => setBedsCount(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Bed</SelectItem>
                <SelectItem value="2">2 Beds</SelectItem>
                <SelectItem value="3">3 Beds</SelectItem>
                <SelectItem value="4">4 Beds</SelectItem>
                <SelectItem value="5+">5+ Beds</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Number of Bathrooms" helperText="How many bathrooms in the room">
            <Select value={bathroomsCount} onValueChange={(value) => setBathroomsCount(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of bathrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Bathroom</SelectItem>
                <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                <SelectItem value="2">2 Bathrooms</SelectItem>
                <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                <SelectItem value="3+">3+ Bathrooms</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </FormRow>

        <FormField label="Room Size (sq ft/m²)" helperText="Size of the room in square feet or meters">
          <Input
            id="size"
            type="text"
            placeholder="e.g., 250 sq ft"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </FormField>
      </FormSection>

      <RoomImagesUploader 
        existingImages={existingImages}
        hotelId={hotelId}
        roomId={roomId}
        onImagesChange={setExistingImages}
        maxImages={6}
      />

      <FormSection title="Amenities">
        <HotelAmenitySelector
          availableAmenities={hotelAmenities}
          selectedAmenities={amenities}
          onChange={setAmenities}
        />
      </FormSection>

      <div className="mt-8 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Room' : 'Create Room'}
        </Button>
      </div>
    </Form>
  );
}