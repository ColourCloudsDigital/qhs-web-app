'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Users, CreditCard, Bed } from 'lucide-react';
import DateRangePicker from '@/components/booking/DateRangePicker';
import RoomSelector from '@/components/booking/RoomSelector';
import BookingForm from '@/components/booking/BookingForm';
import GuestBookingForm from '@/components/booking/GuestBookingForm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingClientProps {
  hotel: any;
  rooms: any[];
  initialCheckInDate: string;
  initialCheckOutDate: string;
  initialGuests?: number;
  customerId?: string | null;
  isLoggedIn: boolean;
}

export default function BookingClient({
  hotel,
  rooms,
  initialCheckInDate,
  initialCheckOutDate,
  initialGuests = 2,
  customerId,
  isLoggedIn,
}: BookingClientProps) {
  const router = useRouter();
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [step, setStep] = useState<'select-room' | 'booking-details'>('select-room');
  
  // Find the selected room details
  const selectedRoom = selectedRoomId 
    ? rooms.find(room => room.id === selectedRoomId) 
    : null;
  
  // Handle continuing to the booking details step
  const handleContinue = () => {
    if (selectedRoomId) {
      setStep('booking-details');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handle going back to room selection
  const handleBack = () => {
    setStep('select-room');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  
  const stepVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        type: "spring",
        stiffness: 100
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };
  
  return (
    <motion.div 
      className="container mx-auto max-w-6xl px-4 py-8"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      {/* Back Link */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link 
          href={`/hotels/${hotel.id}`} 
          className="flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to hotel
        </Link>
      </motion.div>
      
      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {step === 'select-room' ? 'Select a Room' : 'Complete Your Booking'}
        </h1>
        <div className="mt-2 flex items-center text-gray-600 dark:text-gray-400">
          <MapPin className="mr-1 h-4 w-4" />
          <span>
            {hotel.name} - {hotel.address}, {hotel.city}, {hotel.state}, {hotel.country}
          </span>
        </div>
      </motion.div>
      
      {/* Booking Steps */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center">
          <div className="flex items-center">
            <motion.div 
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === 'select-room' ? 'bg-primary text-white' : 'bg-primary text-white'
              }`}
              animate={{
                scale: [1, 1.1, 1],
                transition: { duration: 0.5 }
              }}
            >
              <span>1</span>
            </motion.div>
            <span className={`ml-2 ${
              step === 'select-room' ? 'font-medium text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-white'
            }`}>
              Select Room
            </span>
          </div>
          <motion.div 
            className={`mx-4 h-1 w-16 ${
              step === 'booking-details' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            animate={{
              backgroundColor: step === 'booking-details' ? '#1e40af' : '#d1d5db'
            }}
            transition={{ duration: 0.5 }}
          ></motion.div>
          <div className="flex items-center">
            <motion.div 
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === 'booking-details' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              animate={{
                scale: step === 'booking-details' ? [1, 1.1, 1] : 1,
                transition: { duration: 0.5 }
              }}
            >
              <span>2</span>
            </motion.div>
            <span className={`ml-2 ${
              step === 'booking-details' ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Complete Booking
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* Booking Dates */}
      <motion.div 
        className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Your Stay
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center">
            <Calendar className="mr-3 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Check-in
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(checkInDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-3 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Check-out
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(checkOutDate)}
              </p>
            </div>
          </div>
          <div>
            <DateRangePicker
              startDate={checkInDate}
              endDate={checkOutDate}
              onStartDateChange={setCheckInDate}
              onEndDateChange={setCheckOutDate}
              label={{
                start: 'Change Check-in',
                end: 'Change Check-out',
              }}
              className="mt-2"
            />
          </div>
        </div>
      </motion.div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 'select-room' ? (
          <motion.div
            key="room-selection"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <RoomSelector 
              hotelId={hotel.id}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              selectedRoomId={selectedRoomId}
              onRoomSelect={setSelectedRoomId}
              onContinue={handleContinue}
            />
          </motion.div>
        ) : (
          <motion.div
            key="booking-details"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Selected Room Summary */}
            {selectedRoom && (
              <motion.div 
                className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative mb-4 h-56 w-full overflow-hidden rounded-lg md:mb-0 md:mr-6 md:h-auto md:w-1/3">
                    {selectedRoom.images && selectedRoom.images.length > 0 ? (
                      <Image
                        src={selectedRoom.images[0]}
                        alt={selectedRoom.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <Bed className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedRoom.name}
                    </h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      {selectedRoom.type} Room • Max {selectedRoom.capacity} {selectedRoom.capacity === 1 ? 'Guest' : 'Guests'}
                    </p>
                    <div className="mb-4 flex items-baseline">
                      {selectedRoom.discountedPrice ? (
                        <>
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(selectedRoom.discountedPrice)}
                          </span>{' '}
                          <span className="ml-2 text-sm line-through text-gray-500">
                            {formatCurrency(selectedRoom.pricePerNight)}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(selectedRoom.pricePerNight)}
                        </span>
                      )}
                      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                        / night
                      </span>
                    </div>
                    <motion.button
                      onClick={handleBack}
                      className="mt-4 text-sm text-primary hover:underline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Change Room
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Booking Form - Choose the right form based on login status */}
            {selectedRoom && isLoggedIn && customerId ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <BookingForm
                  hotelId={hotel.id}
                  roomId={selectedRoom.id}
                  roomName={selectedRoom.name}
                  roomType={selectedRoom.type}
                  pricePerNight={selectedRoom.pricePerNight}
                  discountedPrice={selectedRoom.discountedPrice}
                  maxGuests={selectedRoom.capacity}
                  customerId={customerId}
                />
              </motion.div>
            ) : selectedRoom ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <GuestBookingForm
                  hotelId={hotel.id}
                  roomId={selectedRoom.id}
                  roomName={selectedRoom.name}
                  roomType={selectedRoom.type}
                  pricePerNight={selectedRoom.pricePerNight}
                  discountedPrice={selectedRoom.discountedPrice}
                  maxGuests={selectedRoom.capacity}
                  initialGuests={initialGuests}
                />
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}