'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import toast from '@/lib/toast';
import { Amenity } from '@/types/hotel';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RoomFormData {
  id?: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number;
  status: string;
  images: string[];
  roomNumbers: string[];
  amenities: string[];
  bulkCreate?: boolean;
  roomPrefix?: string;
  startNumber?: number;
  count?: number;
}

interface RoomFormProps {
  initialData: Partial<RoomFormData>;
  amenities: Amenity[];
  hotelId: string;
  isLoading: boolean;
  onSubmit: (data: RoomFormData) => void;
  isEditMode?: boolean;
}

const ROOM_TYPES = [
  { id: 'standard', name: 'Standard Room' },
  { id: 'deluxe', name: 'Deluxe Room' },
  { id: 'suite', name: 'Suite' },
  { id: 'executive', name: 'Executive Room' },
  { id: 'family', name: 'Family Room' },
  { id: 'penthouse', name: 'Penthouse Suite' },
  { id: 'studio', name: 'Studio' },
  { id: 'apartment', name: 'Apartment' },
  { id: 'villa', name: 'Villa' },
  { id: 'cottage', name: 'Cottage' },
  { id: 'bungalow', name: 'Bungalow' },
  { id: 'chalet', name: 'Chalet' },
];

const BED_TYPES = [
  { id: 'King', name: 'King' },
  { id: 'Queen', name: 'Queen' },
  { id: 'Twin', name: 'Twin' },
  { id: 'Double', name: 'Double' },
  { id: 'Single', name: 'Single' },
  { id: 'Bunk', name: 'Bunk' },
  { id: 'Sofa', name: 'Sofa Bed' },
  { id: 'Other', name: 'Other' },
];

export function RoomForm({
  initialData,
  amenities,
  hotelId,
  isLoading,
  onSubmit,
  isEditMode = false
}: RoomFormProps) {
  const [activeTab, setActiveTab] = useState<string>(isEditMode ? 'manual' : 'manual');
  const [images, setImages] = useState<string[]>(initialData.images || []);
  const [isImagesTab, setIsImagesTab] = useState(false);
  
  const determineInitialStatus = () => {
    return initialData.status || 'available';
  };
  
  const determineInitialPrice = () => {
    return initialData.pricePerNight || 0;
  };
  
  const [formData, setFormData] = useState<RoomFormData>({
    id: initialData.id,
    name: initialData.name || '',
    type: initialData.type || 'standard',
    description: initialData.description || '',
    capacity: initialData.capacity || 2,
    pricePerNight: determineInitialPrice(),
    discountedPrice: initialData.discountedPrice,
    status: determineInitialStatus(),
    images: initialData.images || [],
    roomNumbers: initialData.roomNumbers || [],
    amenities: initialData.amenities || [],
    bulkCreate: false,
    roomPrefix: '',
    startNumber: 101,
    count: 1
  });
  
  const [manualRoomNumber, setManualRoomNumber] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData.amenities || []);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // For bulk creation
  const [bulkRoomNumbers, setBulkRoomNumbers] = useState<string[]>([]);
  
  // Initialize form with room data if editing
  useEffect(() => {
    if (initialData) {
      // Initialize form data from room data
      setFormData(prev => ({
        ...prev,
        ...initialData,
        pricePerNight: initialData.pricePerNight || prev.pricePerNight,
        status: initialData.status || prev.status,
      }));
      
      if (initialData.amenities) {
        setSelectedAmenities(initialData.amenities);
      }
    }
  }, [initialData]);
  
  // Generate bulk room numbers preview when params change
  useEffect(() => {
    if (activeTab === 'bulk') {
      generateBulkRoomNumbers();
    }
  }, [formData.roomPrefix, formData.startNumber, formData.count, activeTab]);
  
  // Generate bulk room numbers
  const generateBulkRoomNumbers = () => {
    if (!formData.startNumber || !formData.count || formData.count <= 0) {
      setBulkRoomNumbers([]);
      return;
    }
    
    const prefix = formData.roomPrefix || '';
    const start = formData.startNumber;
    const count = Math.min(formData.count, 50); // Limit to 50 rooms for safety
    
    const numbers: string[] = [];
    for (let i = 0; i < count; i++) {
      numbers.push(`${prefix}${start + i}`);
    }
    
    setBulkRoomNumbers(numbers);
  };
  
  // Check room number availability
  const checkRoomNumbersAvailability = async (numbers: string[]) => {
    try {
      setCheckingAvailability(true);
      const response = await fetch('/api/vendor/rooms/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId,
          roomNumbers: numbers,
          excludeRoomId: isEditMode ? initialData.id : undefined
        }),
      });
      
      const data = await response.json();
      
      if (!data.available) {
        toast.error(`These room numbers already exist: ${data.duplicates.join(', ')}`);
        return false;
      }
      
      return true;
    } catch (error) {
      toast.error('Could not check room number availability');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };
  
  // Validate the form
  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Room type is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (formData.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }
    
    if (!formData.pricePerNight || formData.pricePerNight <= 0) {
      errors.pricePerNight = 'Price must be greater than 0';
    }
    
    if (formData.images.length === 0) {
      errors.images = 'At least one image is required';
    }

    // Validate room numbers based on the active tab
    if (activeTab === 'manual') {
      if (formData.roomNumbers.length === 0) {
        errors.roomNumbers = 'At least one room number is required';
      }
    } else if (activeTab === 'bulk') {
      if (!formData.startNumber) {
        errors.startNumber = 'Starting room number is required';
      }
      
      if (!formData.count || formData.count <= 0) {
        errors.count = 'Number of rooms must be greater than 0';
      }
      
      if (bulkRoomNumbers.length === 0) {
        errors.bulkRoomNumbers = 'Failed to generate room numbers';
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return false;
    }
    
    // Check room number availability
    const numbersToCheck = activeTab === 'manual' ? formData.roomNumbers : bulkRoomNumbers;
    const available = await checkRoomNumbersAvailability(numbersToCheck);
    
    return available;
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
  
  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities(prev => [...prev, amenityId]);
    } else {
      setSelectedAmenities(prev => prev.filter(id => id !== amenityId));
    }
  };
  
  const handleImageUpload = (newImages: string[]) => {
    // Update both state variables
    setImages(newImages);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    
    // Clear validation error for images
    if (validationErrors.images) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };
  
  const handleAddRoomNumber = () => {
    if (!manualRoomNumber.trim()) return;
    
    if (formData.roomNumbers.includes(manualRoomNumber)) {
      toast.error('This room number already exists in the list');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      roomNumbers: [...prev.roomNumbers, manualRoomNumber]
    }));
    
    setManualRoomNumber('');
    
    // Clear validation error for room numbers
    if (validationErrors.roomNumbers) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.roomNumbers;
        return newErrors;
      });
    }
  };
  
  const handleRemoveRoomNumber = (number: string) => {
    setFormData(prev => ({
      ...prev,
      roomNumbers: prev.roomNumbers.filter(n => n !== number)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    try {
      // Create data object with just the fields needed for the API
      // Omitting UI-only fields and those not in the database schema
      const apiData: RoomFormData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        capacity: Number(formData.capacity),
        pricePerNight: Number(formData.pricePerNight),
        discountedPrice: formData.discountedPrice ? Number(formData.discountedPrice) : undefined,
        status: formData.status,
        // Use the most up-to-date images array
        images: formData.images,
        roomNumbers: activeTab === 'manual' ? formData.roomNumbers : bulkRoomNumbers,
        amenities: selectedAmenities
      };
      
      console.log('Submitting form with images:', apiData.images);

      // Call the provided onSubmit function with cleaned data
      onSubmit(apiData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save room');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.keys(validationErrors).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Please fix the following errors:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-600 dark:text-red-400">
            {Object.values(validationErrors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Room Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Room Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={validationErrors.name}
              helperText="E.g., Deluxe King Room, Standard Twin Room"
            />
            
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Room Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger id="type" className={validationErrors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a room type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.type && (
                <p className="text-sm text-red-500">{validationErrors.type}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
                error={validationErrors.description}
              />
            </div>
            
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
            />
            
            <Input
              type="number"
              label="Price Per Night (₦)"
              id="pricePerNight"
              name="pricePerNight"
              value={formData.pricePerNight?.toString() || ''}
              onChange={handleChange}
              required
              min={0}
              step={0.01}
              error={validationErrors.pricePerNight}
            />
            
            <Input
              type="number"
              label="Discounted Price (₦)"
              id="discountedPrice"
              name="discountedPrice"
              value={formData.discountedPrice?.toString() || ''}
              onChange={handleChange}
              min={0}
              step={0.01}
              helperText="Optional: Leave empty for no discount"
            />
            
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Room Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditMode && (
            <Tabs 
              defaultValue="manual" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Creation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="mt-4">
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      label="Room Number"
                      id="manualRoomNumber"
                      value={manualRoomNumber}
                      onChange={(e) => setManualRoomNumber(e.target.value)}
                      placeholder="e.g., 101"
                    />
                    <Button
                      type="button"
                      onClick={handleAddRoomNumber}
                      className="mt-8"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  
                  {formData.roomNumbers.length > 0 ? (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Room Numbers:
                      </label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.roomNumbers.map((number) => (
                          <Badge key={number} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                            {number}
                            <button
                              type="button"
                              onClick={() => handleRemoveRoomNumber(number)}
                              className="ml-1 text-gray-500 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No room numbers added yet. Add at least one room number.</p>
                  )}
                  
                  {validationErrors.roomNumbers && (
                    <p className="text-sm text-red-500">{validationErrors.roomNumbers}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="bulk" className="mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    label="Room Prefix (Optional)"
                    id="roomPrefix"
                    name="roomPrefix"
                    value={formData.roomPrefix || ''}
                    onChange={handleChange}
                    placeholder="e.g., R-"
                    helperText="Optional: Add a prefix to room numbers"
                  />
                  
                  <Input
                    type="number"
                    label="Starting Number"
                    id="startNumber"
                    name="startNumber"
                    value={formData.startNumber?.toString() || ''}
                    onChange={handleChange}
                    required
                    min={1}
                    error={validationErrors.startNumber}
                  />
                  
                  <Input
                    type="number"
                    label="Number of Rooms"
                    id="count"
                    name="count"
                    value={formData.count?.toString() || ''}
                    onChange={handleChange}
                    required
                    min={1}
                    max={50}
                    error={validationErrors.count}
                  />
                </div>
                
                {bulkRoomNumbers.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Room Numbers Preview:
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {bulkRoomNumbers.map((number) => (
                        <Badge key={number} variant="secondary" className="px-3 py-1">
                          {number}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      This will create {bulkRoomNumbers.length} rooms of the same type with sequential room numbers.
                    </p>
                  </div>
                )}
                
                {validationErrors.bulkRoomNumbers && (
                  <p className="text-sm text-red-500">{validationErrors.bulkRoomNumbers}</p>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          {isEditMode && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  label="Room Number"
                  id="manualRoomNumber"
                  value={manualRoomNumber}
                  onChange={(e) => setManualRoomNumber(e.target.value)}
                  placeholder="e.g., 101"
                />
                <Button
                  type="button"
                  onClick={handleAddRoomNumber}
                  className="mt-8"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              {formData.roomNumbers.length > 0 ? (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Numbers:
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {formData.roomNumbers.map((number) => (
                      <Badge key={number} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        {number}
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomNumber(number)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No room numbers added yet. Add at least one room number.</p>
              )}
              
              {validationErrors.roomNumbers && (
                <p className="text-sm text-red-500">{validationErrors.roomNumbers}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Room Images</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiImageUploader
            images={formData.images}
            onImagesChange={handleImageUpload}
            maxImages={6}
            uploadDir={`hotels/${hotelId}/rooms`}
            label="Room Images"
            description="Upload up to 6 high-quality images of the room (JPEG, PNG, WebP)"
          />
          
          {/* Debug information */}
          {formData.images && formData.images.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Image count: {formData.images.length}</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-red-500">No images available. Please upload at least one image.</p>
            </div>
          )}
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
        <Button 
          type="submit" 
          disabled={isLoading || checkingAvailability}
        >
          {(isLoading || checkingAvailability) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            isEditMode ? 'Save Changes' : 'Create Room'
          )}
        </Button>
      </div>
    </form>
  );
}