'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface RoomProps {
  id: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
  images: string[];
  status: string;
  amenities: Amenity[];
  onReserve: (roomId: string) => void;
}

export default function RoomCard({
  id,
  name,
  type,
  description,
  capacity,
  pricePerNight,
  discountedPrice,
  images,
  status,
  amenities,
  onReserve
}: RoomProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const toggleDetails = (e: React.MouseEvent) => {
    // Stop propagation to parent elements
    e.stopPropagation();
    e.preventDefault();
    setExpanded(!expanded);
  };

  const nextImage = (e: React.MouseEvent) => {
    // Stop propagation to parent elements
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    // Stop propagation to parent elements
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleReserveClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent parent click handlers
    e.stopPropagation();
    e.preventDefault();
    onReserve(id);
  };

  const handleImageDotClick = (e: React.MouseEvent, index: number) => {
    // Stop propagation to parent elements
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex(index);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="grid gap-6 p-6 md:grid-cols-3">
        {/* Room Image */}
        <div className="relative h-60 w-full overflow-hidden rounded-lg md:h-full">
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImageIndex]}
                alt={name}
                fill
                className="object-cover"
                unoptimized={true}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronUp className="-rotate-90 h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronUp className="rotate-90 h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => handleImageDotClick(e, index)}
                        className={`h-2 w-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="md:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
              {status}
            </span>
          </div>
          
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{type}</p>
          
          <div className="mb-4 flex items-center text-gray-600 dark:text-gray-400">
            <User className="mr-2 h-5 w-5" />
            <span>Up to {capacity} {capacity === 1 ? 'guest' : 'guests'}</span>
          </div>
          
          <p className="mb-4 line-clamp-2 text-gray-700 dark:text-gray-300">{description}</p>
          
          <div className="mb-4 flex flex-wrap gap-2">
            {amenities.slice(0, 3).map((amenity) => (
              <span 
                key={amenity.id} 
                className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {amenity.name}
              </span>
            ))}
            {amenities.length > 3 && !expanded && (
              <button
                onClick={toggleDetails}
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                +{amenities.length - 3} more
              </button>
            )}
          </div>
          
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline">
                {discountedPrice ? (
                  <>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(discountedPrice)}</span>
                    <span className="ml-2 text-base text-gray-500 line-through dark:text-gray-400">{formatCurrency(pricePerNight)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-primary">{formatCurrency(pricePerNight)}</span>
                )}
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/night</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Excludes taxes and fees
              </p>
            </div>
            
            <button
              onClick={handleReserveClick}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              Reserve
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-4">
            <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Room Amenities</h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {amenities.map((amenity) => (
                <div key={amenity.id} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-2">
            <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Description</h4>
            <p className="text-gray-700 dark:text-gray-300">{description}</p>
          </div>
          
          <button
            onClick={toggleDetails}
            className="mt-4 flex items-center text-sm font-medium text-primary hover:text-primary-dark"
          >
            Show less
            <ChevronUp className="ml-1 h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}