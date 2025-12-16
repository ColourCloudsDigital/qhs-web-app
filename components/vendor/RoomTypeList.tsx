'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PencilIcon, 
  EyeIcon, 
  PlusIcon,
} from '@heroicons/react/24/outline';
import { BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  roomCount?: number;
}

interface RoomTypeListProps {
  hotelId: string;
  limit?: number;
}

export function RoomTypeList({ hotelId, limit }: RoomTypeListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        setLoading(true);
        
        // Fetch room types for the hotel
        const response = await fetch(`/api/vendor/room-types?hotelId=${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch room types');
        }
        
        const data = await response.json();
        const types = data.roomTypes.slice(0, limit || data.roomTypes.length);
        setRoomTypes(types);
        
        // Fetch room counts for each room type
        const countPromises = types.map(async (roomType: RoomType) => {
          try {
            const roomResponse = await fetch(`/api/vendor/room-types/${roomType.id}/rooms`);
            if (roomResponse.ok) {
              const roomData = await roomResponse.json();
              return { id: roomType.id, count: roomData.count || 0 };
            }
            return { id: roomType.id, count: 0 };
          } catch (e) {
            console.error(`Error fetching room count for ${roomType.id}:`, e);
            return { id: roomType.id, count: 0 };
          }
        });
        
        const counts = await Promise.all(countPromises);
        const countRecord: Record<string, number> = {};
        counts.forEach(item => {
          countRecord[item.id] = item.count;
        });
        
        setRoomCounts(countRecord);
      } catch (err) {
        console.error('Error fetching room types:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch room types');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoomTypes();
  }, [hotelId, limit]);
  
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
  
  if (roomTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <BedDouble className="h-12 w-12 text-gray-400" />
        <p className="mb-4 mt-2 text-gray-500 dark:text-gray-400">No room types found</p>
        <Link href={`/vendor/hotels/${hotelId}/room-types/create`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Room Type
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {roomTypes.map((roomType) => (
        <Card key={roomType.id}>
          <CardHeader>
            <CardTitle>{roomType.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
              {roomType.description}
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(roomType.basePrice)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Base Price</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{roomType.capacity}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Guests</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{roomCounts[roomType.id] || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Rooms</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Link href={`/vendor/hotels/${hotelId}/room-types/${roomType.id}`}>
              <Button variant="outline" size="sm">
                <EyeIcon className="mr-1 h-4 w-4" />
                View
              </Button>
            </Link>
            <div className="space-x-2">
              <Link href={`/vendor/hotels/${hotelId}/rooms/create?roomTypeId=${roomType.id}`}>
                <Button variant="outline" size="sm">
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Room
                </Button>
              </Link>
              <Link href={`/vendor/hotels/${hotelId}/room-types/${roomType.id}/edit`}>
                <Button variant="outline" size="sm">
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}