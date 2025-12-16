import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { Loader2, MoreVertical, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import toast from '@/lib/toast';

interface RoomGridProps {
  hotelId: string;
  onRoomSelect?: (roomId: string, roomNumber: string) => void;
}

type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning';

interface RoomGridItem {
  id: string;
  roomNumber: string;
  type: string;
  capacity: number;
  price: number;
  status: RoomStatus;
  guestName?: string;
  checkOutDate?: Date;
  bookingId?: string;
}

export default function RoomGrid({ hotelId, onRoomSelect }: RoomGridProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomGridItem[]>([]);
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'type' | 'status'>('status');
  const [visibleRooms, setVisibleRooms] = useState<RoomGridItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch rooms data with their current bookings
  useEffect(() => {
    const fetchRoomsStatus = async () => {
      try {
        setLoading(true);
        console.log('Fetching room status data for hotelId:', hotelId);
        
        const response = await fetch(`/api/vendor/hotels/${hotelId}/rooms/status`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rooms status');
        }
        
        const data = await response.json();
        console.log(`Received ${data.rooms?.length || 0} rooms from API`);
        
        // Debug info
        if (data.rooms?.length > 0) {
          console.log('Sample room data:', data.rooms[0]);
        }
        
        setRooms(data.rooms || []);
        setDebugInfo(data);
      } catch (error) {
        console.error('Error fetching rooms status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (hotelId) {
      fetchRoomsStatus();
    }
  }, [hotelId]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...rooms];
    
    console.log(`Filtering ${filtered.length} rooms with filter: ${filter}`);
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(room => room.status === filter);
    }
    
    // Apply sorting - now only by type or status (prioritizing status)
    if (sortBy === 'type') {
      filtered.sort((a, b) => a.type.localeCompare(b.type));
    } else {
      // First sort by status, then by room number within each status group
      filtered.sort((a, b) => {
        // Primary sort by status
        const statusCompare = a.status.localeCompare(b.status);
        if (statusCompare !== 0) return statusCompare;
        
        // Secondary sort by room number
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });
    }
    
    console.log(`Setting ${filtered.length} visible rooms after filtering/sorting`);
    setVisibleRooms(filtered);
  }, [rooms, filter, sortBy]);

  // Calculate status counts
  useEffect(() => {
    const counts: Record<string, number> = {
      available: 0,
      occupied: 0,
      maintenance: 0,
      reserved: 0,
      cleaning: 0,
      total: rooms.length
    };
    
    rooms.forEach(room => {
      counts[room.status] = (counts[room.status] || 0) + 1;
    });
    
    setStatusCounts(counts);
  }, [rooms]);

  // Handle room selection
  const handleRoomClick = (room: RoomGridItem) => {
    if (onRoomSelect) {
      onRoomSelect(room.id, room.roomNumber);
    } else {
      router.push(`/vendor/hotels/${hotelId}/rooms/${room.id}`);
    }
  };

  // Get status icon based on room status
  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return '/assets/icons/available.png';
      case 'occupied':
        return '/assets/icons/occupied.png';
      case 'maintenance':
        return '/assets/icons/maintenance.png';
      case 'reserved':
        return '/assets/icons/reserved.png';
      case 'cleaning':
        return '/assets/icons/cleaning.png';
      default:
        return '/assets/icons/available.png';
    }
  };

  // Get status label with proper capitalization
  const getStatusLabel = (status: RoomStatus | 'all') => {
    if (status === 'all') return 'All Rooms';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get color class based on room status
  const getStatusColorClass = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700';
      case 'occupied':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700';
      case 'maintenance':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-700';
      case 'reserved':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700';
      case 'cleaning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  // Handle room status change
  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    try {
      // Send the status update to the API
      const response = await fetch(`/api/vendor/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update room status');
      }
      
      // Update local state after successful API call
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      );
      
      setRooms(updatedRooms);
      toast.success(`Room status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update room status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-500 dark:text-gray-400">Loading rooms...</p>
      </div>
    );
  }
  
  // Display error if no rooms are available
  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No room data available. Please check your database connection.</p>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          Debug info: {JSON.stringify(debugInfo)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
          <Select 
            value={filter} 
            onValueChange={(value) => setFilter(value as RoomStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <Select 
            value={sortBy} 
            onValueChange={(value) => setSortBy(value as 'type' | 'status')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="type">Room Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Status counts */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Badge variant="outline" className="bg-white dark:bg-gray-800">
          Total: {statusCounts.total || 0}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Available: {statusCounts.available || 0}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Occupied: {statusCounts.occupied || 0}
        </Badge>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          Reserved: {statusCounts.reserved || 0}
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          Maintenance: {statusCounts.maintenance || 0}
        </Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          Cleaning: {statusCounts.cleaning || 0}
        </Badge>
      </div>
      
      {visibleRooms.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No rooms match the selected filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleRooms.map((room) => (
            <TooltipProvider key={`${room.id}-${room.roomNumber}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`group relative flex cursor-pointer flex-col items-center rounded-lg border p-4 shadow-sm transition-all hover:shadow-md ${getStatusColorClass(room.status)}`}
                    onClick={() => handleRoomClick(room)}
                  >
                    {/* Status change dropdown */}
                    {room.status !== 'occupied' && room.status !== 'reserved' && (
                      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {room.status !== 'available' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(room.id, 'available');
                              }}>
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                Mark as Available
                              </DropdownMenuItem>
                            )}
                            {room.status !== 'cleaning' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(room.id, 'cleaning');
                              }}>
                                <Check className="mr-2 h-4 w-4 text-yellow-500" />
                                Mark as Cleaning
                              </DropdownMenuItem>
                            )}
                            {room.status !== 'maintenance' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(room.id, 'maintenance');
                              }}>
                                <Check className="mr-2 h-4 w-4 text-orange-500" />
                                Mark as Maintenance
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    
                    <div className="mb-3 text-center">
                      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{room.roomNumber}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{room.type}</div>
                    </div>
                    
                    <div className="mb-2 h-10 w-10 relative">
                      <Image 
                        src={getStatusIcon(room.status)} 
                        alt={room.status}
                        width={40}
                        height={40}
                      />
                    </div>
                    
                    <div className="text-center w-full">
                      <div className="font-bold text-lg text-primary dark:text-primary-light">{formatCurrency(room.price)}</div>
                      <div className="mt-1 inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-full capitalize bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {room.status}
                      </div>
                      {room.status === 'occupied' && room.guestName && (
                        <div className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">
                          {room.guestName}
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-2 p-2 max-w-xs">
                    <div className="font-medium text-lg">Room {room.roomNumber}</div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{room.type}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm">{formatCurrency(room.price)}/night</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">Capacity:</span>
                      <span className="ml-1 text-sm">{room.capacity} {room.capacity > 1 ? 'guests' : 'guest'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="ml-1 text-sm capitalize">{room.status}</span>
                    </div>
                    {room.status === 'occupied' && room.checkOutDate && (
                      <div className="text-sm">
                        <span className="font-medium">Check-out:</span>{' '}
                        <span>{new Date(room.checkOutDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    )}
                    {room.guestName && (
                      <div className="text-sm">
                        <span className="font-medium">Guest:</span>{' '}
                        <span>{room.guestName}</span>
                      </div>
                    )}
                    {room.bookingId && (
                      <div className="pt-1">
                        <Link 
                          href={`/vendor/bookings/${room.bookingId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary underline hover:text-primary-dark"
                        >
                          View Booking Details
                        </Link>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
      
      {/* Status Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Status:</div>
        <div className="flex flex-wrap gap-4">
          {['available', 'occupied', 'reserved', 'maintenance', 'cleaning'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <Image 
                  src={getStatusIcon(status as RoomStatus)} 
                  alt={status}
                  width={24}
                  height={24}
                />
              </div>
              <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}