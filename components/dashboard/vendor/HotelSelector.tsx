'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from '@/lib/services/toast.service';

interface HotelSelectorProps {
  vendorId: string;
  onHotelChange: (hotelId: string) => void;
  value?: string;
  disabled?: boolean;
}

export default function HotelSelector({
  vendorId,
  onHotelChange,
  value,
  disabled = false,
}: HotelSelectorProps) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (vendorId) {
      fetchHotels();
    }
  }, [vendorId]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotels?vendorId=${vendorId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch hotels');
      }
      const data = await res.json();
      setHotels(data.data || []);
      
      // If no hotel is selected and we have hotels, select the first one
      if (!value && data.data && data.data.length > 0) {
        onHotelChange(data.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={value} onValueChange={onHotelChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a hotel" />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <SelectItem value="loading" disabled>
            Loading hotels...
          </SelectItem>
        ) : hotels.length === 0 ? (
          <SelectItem value="none" disabled>
            No hotels found
          </SelectItem>
        ) : (
          hotels.map((hotel) => (
            <SelectItem key={hotel.id} value={hotel.id}>
              {hotel.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export { HotelSelector };