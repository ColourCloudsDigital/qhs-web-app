'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  User, 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Check,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ImageLightbox from '@/components/common/ImageLightbox';
import { useBookingStore } from '@/lib/hooks/useBookingContext';

// Defining more specific types
interface Hotel {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
  images: string[];
  rating?: number;
}

interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
  images: string[];
  amenities: Amenity[];
  status: string;
}

interface RoomDetailClientProps {
  hotel: Hotel;
  room: Room;
  relatedRooms: Room[];
}

export default function RoomDetailClient({ 
  hotel, 
  room,
  relatedRooms
}: RoomDetailClientProps) {
  const router = useRouter();
  const addBooking = useBookingStore((state) => state.addBooking);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(2); // Aligned default to 2
  
  // Get today's date and tomorrow's date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format dates for the input fields
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Format today and tomorrow for min dates
  const todayFormatted = formatDateForInput(today);
  const tomorrowFormatted = formatDateForInput(tomorrow);
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  const nextImage = () => {
    if (room.images.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % room.images.length);
    }
  };
  
  const prevImage = () => {
    if (room.images.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + room.images.length) % room.images.length);
    }
  };
  
  const handleReservation = () => {
    if (!checkInDate || !checkOutDate || !guests) {
      alert('Please select check-in date, check-out date and number of guests');
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    // Add booking to store
    const bookingId = `${room.id}-${Date.now()}`;
    addBooking({
      id: bookingId,
      roomId: room.id,
      roomName: room.name,
      hotelId: hotel.id,
      hotelName: hotel.name,
      checkInDate,
      checkOutDate,
      guests,
      price: room.discountedPrice || room.pricePerNight,
      bookedAt: new Date().toISOString(),
    });

    const params = new URLSearchParams({
      checkInDate,
      checkOutDate,
      guests: guests.toString(),
    });

    router.push(
      `/hotels/${hotel.id}/book/${room.id}?${params.toString()}`
    );
  };

  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link 
          href={`/hotels/${hotel.id}`} 
          className="flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to {hotel.name}
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <MapPin className="mr-1 h-4 w-4" />
          <Link href={`/hotels/${hotel.id}`} className="hover:text-primary hover:underline">
            {hotel.name}, {hotel.city}, {hotel.state}
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Main Image */}
          <div className="relative mb-4">
            <div 
              className="relative h-80 w-full overflow-hidden rounded-lg cursor-pointer md:h-96"
              onClick={() => openLightbox(currentImageIndex)}
            >
              <Image
                src={room.images[currentImageIndex] || '/images/placeholder-room.jpg'}
                alt={room.name}
                fill
                className="object-cover transition-transform hover:scale-105"
                priority
              />
            </div>
            
            {room.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {room.images.length > 1 && (
            <div className="mb-8 grid grid-cols-4 gap-2">
              {room.images.map((image: string, index: number) => (
                <div 
                  key={index} 
                  className={`relative h-20 overflow-hidden rounded-lg cursor-pointer ${
                    index === currentImageIndex ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    openLightbox(index);
                  }}
                >
                  <Image
                    src={image}
                    alt={`${room.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Room Details */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Room Details</h2>
            
            <div className="mb-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Type</h3>
                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">{room.type} Room</p>
              </div>
              
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</h3>
                <div className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
              <p className="text-gray-700 dark:text-gray-300">{room.description}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Pricing</h3>
              <div className="flex items-baseline">
                {room.discountedPrice ? (
                  <>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(room.discountedPrice)}</span>
                    <span className="ml-2 text-base text-gray-500 line-through dark:text-gray-400">
                      {formatCurrency(room.pricePerNight)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-primary">{formatCurrency(room.pricePerNight)}</span>
                )}
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/night</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Excludes taxes and fees
              </p>
            </div>
          </div>
          
          {/* Room Amenities */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Amenities</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {room.amenities.map((amenity: any) => (
                <div key={amenity.id} className="flex items-start">
                  <Check className="mr-2 mt-0.5 h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{amenity.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{amenity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Related Rooms */}
          {relatedRooms.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Other Rooms You Might Like</h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {relatedRooms.map((relatedRoom) => (
                  <Link 
                    key={relatedRoom.id} 
                    href={`/hotels/${hotel.id}/rooms/${relatedRoom.id}`}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-transform hover:scale-105 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={relatedRoom.images[0] || '/images/placeholder-room.jpg'}
                        alt={relatedRoom.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">{relatedRoom.name}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <User className="mr-1 h-4 w-4" />
                        <span>Up to {relatedRoom.capacity} guests</span>
                      </div>
                      <div className="mt-2 flex items-baseline">
                        {relatedRoom.discountedPrice ? (
                          <>
                            <span className="font-bold text-primary">{formatCurrency(relatedRoom.discountedPrice)}</span>
                            <span className="ml-1 text-xs text-gray-500 line-through dark:text-gray-400">
                              {formatCurrency(relatedRoom.pricePerNight)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary">{formatCurrency(relatedRoom.pricePerNight)}</span>
                        )}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">/night</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Booking Panel */}
        <div className="lg:relative">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Book This Room</h2>
              
              <div className="mb-4">
                <div className="flex items-baseline">
                  {room.discountedPrice ? (
                    <>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(room.discountedPrice)}</span>
                      <span className="ml-2 text-base text-gray-500 line-through dark:text-gray-400">
                        {formatCurrency(room.pricePerNight)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-primary">{formatCurrency(room.pricePerNight)}</span>
                  )}
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/night</span>
                </div>
              </div>
              
              <div className="mb-4 space-y-4">
                <div>
                  <label htmlFor="check-in" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Check-in
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="check-in"
                      min={todayFormatted}
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="check-out" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Check-out
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="check-out"
                      min={checkInDate || tomorrowFormatted}
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="guests" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Guests
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="guests"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      {Array.from({ length: room.capacity }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleReservation}
                className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Reserve Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              
              <div className="mt-4 flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <Info className="h-4 w-4" />
                <p>
                  Don't miss this room! Prices may increase if you view this room again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lightbox */}
      {room.images && room.images.length > 0 && (
        <ImageLightbox
          images={room.images}
          isOpen={lightboxOpen}
          setIsOpen={setLightboxOpen}
          startIndex={lightboxIndex}
          title={room.name}
        />
      )}
    </div>
  );
}