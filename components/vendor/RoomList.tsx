'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PencilIcon, 
  EyeIcon, 
  PlusIcon,
  BedDoubleIcon,
  UsersIcon,
  DollarSignIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number;
  status: string;
  images: string[];
  roomNumbers: string[];
}

interface RoomListProps {
  hotelId: string;
  limit?: number;
}

// Map room type IDs to friendly names
const ROOM_TYPE_NAMES: Record<string, string> = {
  'standard': 'Standard Room',
  'deluxe': 'Deluxe Room',
  'suite': 'Suite',
  'executive': 'Executive Room',
  'family': 'Family Room',
  'penthouse': 'Penthouse Suite',
  'studio': 'Studio',
  'apartment': 'Apartment',
  'villa': 'Villa',
  'cottage': 'Cottage',
  'bungalow': 'Bungalow',
  'chalet': 'Chalet',
};

export function RoomList({ hotelId, limit }: RoomListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        // Build the API URL with filters
        let apiUrl = `/api/vendor/rooms?hotelId=${hotelId}`;
        
        // Fetch rooms
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        
        const data = await response.json();
        setRooms(data.rooms.slice(0, limit || data.rooms.length));
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [hotelId, limit]);
  
  // Get a status badge for a room
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">{status}</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">{status}</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get a default image for a room
  const getDefaultImage = (room: Room) => {
    if (room.images && Array.isArray(room.images) && room.images.length > 0 && room.images[0]) {
      const image = room.images[0];
      // Handle both relative and absolute paths
      if (image.startsWith('http') || image.startsWith('/')) {
        return image;
      }
      // Add leading slash if missing
      return `/${image}`;
    }
    return '/assets/images/placeholder-room.jpg';
  };
  
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <div className="text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }
  
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <BedDoubleIcon className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No rooms found</h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Add rooms to your hotel to manage bookings and availability.
        </p>
        <Link href={`/vendor/hotels/${hotelId}/rooms/create`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Your First Room
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 grid-cols-5">
      {rooms.map((room) => (
        <Card key={room.id} className="group overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all dark:border-gray-700">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={getDefaultImage(room)}
              alt={room.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                console.error(`Failed to load room image: ${getDefaultImage(room)}`);
                // Set fallback image
                e.currentTarget.src = '/assets/images/placeholder-room.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-xl font-bold text-white">{room.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-200">
                    {ROOM_TYPE_NAMES[room.type] || room.type}
                  </p>
                  {getStatusBadge(room.status)}
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center rounded-lg bg-blue-50 p-2 dark:bg-blue-900/10">
                <UsersIcon className="mb-1 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{room.capacity}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">Guests</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center rounded-lg bg-green-50 p-2 dark:bg-green-900/10">
                <DollarSignIcon className="mb-1 h-4 w-4 text-green-600 dark:text-green-400" />
                <div className="text-center">
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(room.pricePerNight).replace('₦', '₦')}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">Per Night</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center rounded-lg bg-purple-50 p-2 dark:bg-purple-900/10">
                <BedDoubleIcon className="mb-1 h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{room.roomNumbers?.length || 0}</div>
                  <div className="text-xs text-purple-600 dark:text-purple-300">Rooms</div>
                </div>
              </div>
            </div>
            
            {room.roomNumbers && room.roomNumbers.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Room Numbers</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {room.roomNumbers.slice(0, 5).map((number, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                      {number}
                    </Badge>
                  ))}
                  {room.roomNumbers.length > 5 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                      +{room.roomNumbers.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t bg-gray-50 p-4 dark:bg-gray-800/50">
            <Link href={`/vendor/hotels/${hotelId}/rooms/${room.id}`}>
              <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
                <EyeIcon className="mr-1 h-4 w-4" />
                View
              </Button>
            </Link>
            <Link href={`/vendor/hotels/${hotelId}/rooms/${room.id}/edit`}>
              <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
                <PencilIcon className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}