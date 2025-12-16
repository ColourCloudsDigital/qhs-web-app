'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, Check, Calendar, ArrowLeft } from 'lucide-react';
import RoomCardWrapper from '@/components/hotels/RoomCardWrapper';
import HotelAmenities from '@/components/hotels/HotelAmenities';
import ReservationPanel from '@/components/hotels/ReservationPanel';
import ImageLightbox from '@/components/common/ImageLightbox';

interface HotelDetailClientProps {
  hotel: any;
  sortedRooms: any[];
  lowestPrice: number | null;
  lowestDiscountedPrice: number | null;
}

export default function HotelDetailClient({ 
  hotel, 
  sortedRooms, 
  lowestPrice, 
  lowestDiscountedPrice 
}: HotelDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Ensure hotel.images is an array
  const hotelImages = Array.isArray(hotel.images) ? hotel.images : [];
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  // Check if we have rooms data
  const hasRooms = Array.isArray(sortedRooms) && sortedRooms.length > 0;
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link 
          href="/hotels" 
          className="flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to hotels
        </Link>
      </div>
      
      {/* Hotel Header with Logo */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {hotel.whitelabelConfig?.logo && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
              <img
                src={hotel.whitelabelConfig.logo}
                alt={`${hotel.name} logo`}
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback for broken images
                  (e.currentTarget as HTMLImageElement).src = '/assets/images/placeholder.jpg';
                }}
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{hotel.name}</h1>
            <div className="mt-2 flex items-center">
              {hotel.rating && (
                <div className="flex items-center">
                  <Star className="mr-1 h-5 w-5 text-yellow-400" />
                  <span className="mr-2 font-medium">{hotel.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin className="mr-1 h-4 w-4" />
                <span>
                  {hotel.address}, {hotel.city}, {hotel.state}, {hotel.country}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Main Image */}
          <div 
            className="relative mb-4 h-80 w-full overflow-hidden rounded-lg md:h-96 cursor-pointer"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={hotelImages[0] || '/images/placeholder-hotel.jpg'}
              alt={hotel.name}
              fill
              className="object-cover transition-transform hover:scale-105"
              priority
            />
          </div>
          
          {/* Thumbnail Gallery */}
          {hotelImages.length > 1 && (
            <div className="mb-8 grid grid-cols-4 gap-2">
              {hotelImages.slice(1).map((image: string, index: number) => (
                <div 
                  key={index} 
                  className="relative h-20 overflow-hidden rounded-lg cursor-pointer"
                  onClick={() => openLightbox(index + 1)}
                >
                  <Image
                    src={image}
                    alt={`${hotel.name} - Image ${index + 2}`}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Hotel Description */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">About this hotel</h2>
            <p className="mb-4 whitespace-pre-line text-gray-700 dark:text-gray-300">{hotel.description}</p>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Check-in</h3>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Clock className="mr-2 h-5 w-5 text-gray-400" />
                  <span>From 3:00 PM</span>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Check-out</h3>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Clock className="mr-2 h-5 w-5 text-gray-400" />
                  <span>Until 11:00 AM</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Amenities Section */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <section className="mb-12">
              <HotelAmenities amenities={hotel.amenities} />
            </section>
          )}
          
          {/* Rooms Section */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Available Rooms</h2>
            {hasRooms ? (
              <div className="space-y-6">
                {sortedRooms.map((room) => (
                  <RoomCardWrapper 
                    key={room.id}
                    room={room}
                    hotelId={hotel.id}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-800/50 text-center">
                <p className="text-gray-700 dark:text-gray-300">
                  No rooms available at the moment. Please check back later or contact the hotel directly.
                </p>
              </div>
            )}
          </section>
          
          {/* Hotel Policies Section */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Hotel Policies</h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Cancellation Policy</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Free cancellation up to 48 hours before check-in. Cancellations made within 48 hours of check-in are subject to a charge equal to one night&apos;s stay.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Special Requests</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Special requests are subject to availability and cannot be guaranteed. Please note them during the booking process.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Payment Methods</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We accept all major credit cards, debit cards, and mobile payment methods.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Reservation Panel - Sticky */}
        <div className="lg:relative">
          <div className="lg:sticky lg:top-24">
            {hasRooms && lowestPrice ? (
              <ReservationPanel 
                hotelId={hotel.id} 
                lowestPrice={lowestPrice} 
                discountedPrice={lowestDiscountedPrice} 
              />
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Contact for Booking</h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  To book this hotel, please contact the property directly for pricing and availability.
                </p>
                <button
                  className="w-full rounded-md bg-primary py-2 text-center font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Contact Hotel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Lightbox */}
      {hotelImages.length > 0 && (
        <ImageLightbox
          images={hotelImages}
          isOpen={lightboxOpen}
          setIsOpen={setLightboxOpen}
          startIndex={lightboxIndex}
          title={hotel.name}
        />
      )}
    </div>
  );
}