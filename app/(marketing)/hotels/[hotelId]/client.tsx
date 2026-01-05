'use client';

import { useState, useCallback } from 'react';
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

// Rating component to display star ratings
function HotelRating({ rating, className = "" }: { rating: number | null; className?: string }) {
  if (!rating) return null;

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-5 w-5 text-gray-300" />
          <Star className="absolute left-0 top-0 h-5 w-5 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      ))}

      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {rating.toFixed(1)}
      </span>
    </div>
  );
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

  const contactHotel = useCallback(async () => {
    if (!hotel?.id) {
      alert('No contact information available for this hotel.');
      return;
    }

    const message = `Guest requested contact for hotel ${hotel.name || hotel.id}. Page: ${typeof window !== 'undefined' ? window.location.href : ''}`;

    try {
      const res = await fetch(`/api/hotels/${hotel.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: null, email: null, phone: null, message }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('Message sent — the hotel will contact you shortly.');
      } else {
        console.error('Contact API error:', data);
        alert(data?.error || 'Failed to send message to the hotel.');
      }
    } catch (error) {
      console.error('Contact request failed:', error);
      alert('Failed to send message. Please try again later.');
    }
  }, [hotel]);
  
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{hotel.name}</h1>

            {/* Rating and Location Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              {hotel.rating !== null && hotel.rating !== undefined && (
                <HotelRating rating={hotel.rating} />
              )}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                <span className="text-sm">
                  {hotel.address}, {hotel.city}, {hotel.state}, {hotel.country}
                </span>
              </div>
            </div>

            {/* Additional hotel info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Check-in: 3:00 PM • Check-out: 11:00 AM</span>
              </div>
              {sortedRooms.length > 0 && (
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{sortedRooms.length} room{sortedRooms.length !== 1 ? 's' : ''} available</span>
                </div>
              )}
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
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">About this hotel</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">{hotel.description}</p>
              </div>

              {/* Hotel Stats Cards */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Check-in</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">From 3:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-green-100">Check-out</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">Until 11:00 AM</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">Available Rooms</h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">{sortedRooms.length} room{sortedRooms.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Amenities Section */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <section className="mb-12">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Hotel Amenities</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Enjoy these premium amenities and services during your stay
                </p>
                <HotelAmenities amenities={hotel.amenities} />
              </div>
            </section>
          )}
          
          {/* Rooms Section */}
          <section className="mb-12">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Rooms</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Choose from our selection of comfortable rooms and suites
                </p>
              </div>
              {hasRooms && (
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/20">
                  {sortedRooms.length} room{sortedRooms.length !== 1 ? 's' : ''} available
                </div>
              )}
            </div>

            {hasRooms ? (
              <div className="space-y-8">
                {sortedRooms.map((room, index) => (
                  
                    <RoomCardWrapper
                      room={room}
                      hotelId={hotel.id}
                    />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-600 dark:bg-gray-800/50">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No rooms available</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All rooms are currently booked. Please check back later or contact the hotel directly for availability.
                </p>
              </div>
            )}
          </section>
          
          {/* Hotel Policies Section */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Hotel Policies & Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Cancellation Policy</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Free cancellation up to 48 hours before check-in. Cancellations made within 48 hours of check-in are subject to a charge equal to one night's stay.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Special Requests</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Special requests are subject to availability and cannot be guaranteed. Please note them during the booking process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                      <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        We accept all major credit cards, debit cards, and mobile payment methods including bank transfers and digital wallets.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                      <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Location & Transport</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Located in the heart of {hotel.city}. Public transportation available. Airport shuttle service can be arranged upon request.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Reservation Panel - Sticky */}
        <div className="lg:relative">
          <div className="lg:sticky lg:top-24">
            {hasRooms && lowestPrice ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <ReservationPanel
                  hotelId={hotel.id}
                  lowestPrice={lowestPrice}
                  discountedPrice={lowestDiscountedPrice}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Contact for Booking</h3>
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    To book this hotel, please contact the property directly for pricing and availability.
                  </p>
                  <button
                    type="button"
                    onClick={contactHotel}
                    className="w-full rounded-lg bg-primary py-3 text-center font-medium text-white transition-all hover:bg-primary-dark hover:shadow-md">
                    Contact Hotel
                  </button>
                </div>
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