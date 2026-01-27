'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Bed, Users, Check, X, Info, Wifi, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice: number | null;
  isAvailable: boolean;
  images?: string[];
}

interface RoomSelectorProps {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  onRoomSelect: (roomId: string | null) => void;
  selectedRoomId?: string | null;
  className?: string;
  onContinue?: () => void;
}

export default function RoomSelector({
  hotelId,
  checkInDate,
  checkOutDate,
  onRoomSelect,
  selectedRoomId = null,
  className = '',
  onContinue,
}: RoomSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  // Fetch available rooms when dates change
  useEffect(() => {
    const fetchRooms = async () => {
      if (!hotelId || !checkInDate || !checkOutDate) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/rooms/availability?hotelId=${hotelId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch rooms');
        }

        const data = await response.json();
        console.log('Room data received:', data.rooms);
        setRooms(data.rooms);

        // If selected room is no longer available, clear selection
        if (
          selectedRoomId &&
          !data.rooms.find(
            (room: Room) => room.id === selectedRoomId && room.isAvailable
          )
        ) {
          onRoomSelect(null);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching rooms:', err);
        setRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [hotelId, checkInDate, checkOutDate, selectedRoomId, onRoomSelect]);

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    // Toggle selection
    const newSelectedId = roomId === selectedRoomId ? null : roomId;
    onRoomSelect(newSelectedId);
  };

  // Handle continue button click
  const handleContinue = () => {
    if (onContinue && selectedRoomId) {
      onContinue();
    }
  };

  // Handle image navigation
  const handleImageNav = (e: React.MouseEvent, roomId: string, direction: 'next' | 'prev') => {
    e.stopPropagation();

    if (!rooms.find(room => room.id === roomId)?.images?.length) return;

    const imagesLength = rooms.find(room => room.id === roomId)?.images?.length || 0;
    
    setActiveImageIndices(prev => {
      const currentIndex = prev[roomId] || 0;
      
      if (direction === 'next') {
        return { ...prev, [roomId]: (currentIndex + 1) % imagesLength };
      } else {
        return { ...prev, [roomId]: currentIndex > 0 ? currentIndex - 1 : imagesLength - 1 };
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center py-12">
          <div 
            className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"
          ></div>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300">
          Finding the perfect room for your stay...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-md bg-red-50 p-6 dark:bg-red-900/30">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-400">
                Error fetching rooms
              </h3>
              <div className="mt-2 text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
          <X className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">
            No rooms available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No rooms found for the selected dates. Try selecting different dates or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Select Your Perfect Room
      </h3>
      
      <div className="space-y-6">
        {rooms.map((room) => {
          // Initialize image index for this room if not exist
          if (activeImageIndices[room.id] === undefined) {
            setActiveImageIndices(prev => ({...prev, [room.id]: 0}));
          }

          const activeIndex = activeImageIndices[room.id] || 0;
          const hasMultipleImages = room.images && room.images.length > 1;
          const isSelected = selectedRoomId === room.id;
          
          return (
            <motion.div
              key={room.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`overflow-hidden rounded-xl transition-all duration-300 ease-in-out
                ${isSelected 
                  ? 'border-4 border-black dark:border-gray-900 shadow-lg transform scale-[1.01]' 
                  : 'border border-gray-200 dark:border-gray-700 hover:shadow-md'}
                ${!room.isAvailable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              onClick={() => room.isAvailable && handleRoomSelect(room.id)}
            >
              <div className="flex flex-col md:flex-row">
                {/* Room Image with carousel controls */}
                {room.images && room.images.length > 0 ? (
                  <div className="relative h-64 w-full md:h-auto md:w-2/5">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${room.id}-${activeIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full"
                      >
                        <Image
                          src={room.images[activeIndex]}
                          alt={room.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 40vw"
                          unoptimized={true}
                        />
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Image navigation controls */}
                    {hasMultipleImages && (
                      <>
                        <button 
                          onClick={(e) => handleImageNav(e, room.id, 'prev')}
                          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-black/60"
                        >
                          &#10094;
                        </button>
                        <button
                          onClick={(e) => handleImageNav(e, room.id, 'next')}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-black/60"
                        >
                          &#10095;
                        </button>
                        
                        {/* Image pagination dots */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                          {room.images.map((_, index) => (
                            <span 
                              key={index}
                              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                index === activeIndex ? 'bg-white scale-125' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Availability badge */}
                    <div className="absolute right-2 top-2">
                      {room.isAvailable ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/60 dark:text-green-400">
                          <Check className="mr-1 h-4 w-4" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/60 dark:text-red-400">
                          <X className="mr-1 h-4 w-4" />
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 w-full items-center justify-center bg-gray-100 md:w-2/5 dark:bg-gray-800">
                    <Bed className="h-16 w-16 text-gray-400" />
                  </div>
                )}
            
                {/* Room Details */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {room.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {room.type} Room
                    </p>
                  </div>
                
                  {/* Room Features */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-primary/80" />
                      <span className="text-gray-700 dark:text-gray-300">Max {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <div className="flex items-center">
                      <Bed className="mr-2 h-5 w-5 text-primary/80" />
                      <span className="text-gray-700 dark:text-gray-300">{room.type} bed</span>
                    </div>
                    <div className="flex items-center">
                      <Wifi className="mr-2 h-5 w-5 text-primary/80" />
                      <span className="text-gray-700 dark:text-gray-300">Free WiFi</span>
                    </div>
                    <div className="flex items-center">
                      <Coffee className="mr-2 h-5 w-5 text-primary/80" />
                      <span className="text-gray-700 dark:text-gray-300">Coffee maker</span>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
              
                  {/* Price and Selection */}
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline">
                        {room.discountedPrice !== null ? (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              {formatCurrency(room.discountedPrice)}
                            </span>{' '}
                            <span className="ml-2 text-sm line-through text-gray-500">
                              {formatCurrency(room.pricePerNight)}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(room.pricePerNight)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">per night</span>
                    </div>
                    
                    {/* Selection button */}
                    {room.isAvailable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoomSelect(room.id);
                        }}
                        className={`rounded-lg px-6 py-2 font-medium transition-all duration-300
                          ${isSelected
                            ? 'bg-black text-white dark:bg-gray-900'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                          }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Fixed "Continue to Booking" Button that appears when a room is selected */}
      <AnimatePresence>
        {selectedRoomId && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 z-20 w-full bg-white bg-opacity-90 p-4 shadow-md backdrop-blur dark:bg-gray-900 dark:bg-opacity-90"
          >
            <div className="container mx-auto flex max-w-6xl items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {rooms.find(r => r.id === selectedRoomId)?.images?.[0] ? (
                    <Image
                      src={rooms.find(r => r.id === selectedRoomId)?.images?.[0] || ''}
                      alt="Selected room"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized={true}
                    />
                  ) : (
                    <Bed className="h-full w-full p-2 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {rooms.find(r => r.id === selectedRoomId)?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected Room
                  </p>
                </div>
              </div>
              <button
                id="continue-to-booking-btn"
                onClick={handleContinue}
                className="rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                Continue to Booking
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}