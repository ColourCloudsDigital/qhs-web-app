'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Bed, 
  Users, 
  CalendarDays, 
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BookingRoomDetailsProps {
  room: any;
  hotel: any;
  nights: number;
  totalAmount: number;
}

export default function BookingRoomDetails({ 
  room, 
  hotel, 
  nights, 
  totalAmount 
}: BookingRoomDetailsProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  // Handle room images or placeholder
  const roomImages = room?.images ? 
    (typeof room.images === 'string' ? JSON.parse(room.images) : room.images) : 
    [];
  
  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Room Images */}
      {roomImages.length > 0 && (
        <motion.div variants={itemVariants} className="relative h-60 w-full overflow-hidden rounded-lg">
              <Image
            src={roomImages[0]}
            alt={room?.name || 'Room image'}
                fill
                className="object-cover"
          />
          {roomImages.length > 1 && (
            <div className="absolute bottom-2 right-2 flex space-x-1">
              {roomImages.slice(0, 3).map((image: string, index: number) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
              {roomImages.length > 3 && (
                <div className="h-2 w-2 rounded-full bg-white/50" />
              )}
            </div>
          )}
        </motion.div>
      )}
        
      {/* Room Information */}
      <motion.div variants={itemVariants} className="flex flex-col space-y-4">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {room?.name || 'Room'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {room?.type || 'Standard Room'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(room?.pricePerNight || 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">per night</p>
          </div>
          </div>
          
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Bed className="mr-2 h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {room?.type || 'Standard Room'}
            </span>
          </div>
          
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Max {room?.capacity || 2} guests
            </span>
          </div>
        </div>
        
        {room?.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {room.description}
          </p>
        )}
      </motion.div>

      {/* Price Breakdown */}
      <motion.div 
        variants={itemVariants}
        className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
      >
        <h4 className="mb-3 text-md font-medium text-gray-900 dark:text-white">
          Price Details
        </h4>
          
          <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatCurrency(room?.pricePerNight || 0)} x {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
              <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency((room?.pricePerNight || 0) * nights)}
              </span>
            </div>
            
          {/* Only show if there's a difference between calculated total and actual total */}
          {totalAmount !== (room?.pricePerNight || 0) * nights && (
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {totalAmount > (room?.pricePerNight || 0) * nights ? 'Additional fees' : 'Discount'}
                </span>
              </div>
              <span className={`font-medium ${totalAmount > (room?.pricePerNight || 0) * nights ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatCurrency(Math.abs(totalAmount - ((room?.pricePerNight || 0) * nights)))}
              </span>
            </div>
          )}
            
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900 dark:text-white">Total</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}