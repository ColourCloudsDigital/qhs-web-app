'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import IconPlus from '@/components/icon/icon-plus';
import IconHome from '@/components/icon/icon-home';
import IconX from '@/components/icon/icon-x';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import { formatDate } from '@/lib/utils';
import NotificationDashboard from '@/components/customer/NotificationDashboard';
import { useBookingStore } from '@/lib/hooks/useBookingContext';

import {
  MapPin,
  Bed,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Eye,
  Hotel
} from 'lucide-react';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';

type Room = {
  id: string;  // Changed from roomId to id to match API response
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
  availableUnits?: number;
};

type Hotel = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  images?: string[];
  rating?: number | null;
  rooms?: Room[];
  room_count?: number;
  total_capacity?: number;
};

type Booking = {
  id: string;
  hotelId: string;
  roomId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms?: number;
  totalAmount: number;
  status: string;
  createdAt?: string; // Added for booking creation time
};

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const refreshTrigger = useBookingStore((state) => state.refreshTrigger);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomCount, setRoomCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadHotelsAndBookings();
    }
  }, [status]);

  // Refresh when booking is cancelled or status changes
  useEffect(() => {
    if (isMounted && status === 'authenticated' && refreshTrigger > 0) {
      loadHotelsAndBookings();
    }
  }, [refreshTrigger, status, isMounted]);

  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const loadHotelsAndBookings = async () => {
    try {
      setIsLoadingData(true);
      
      // Check for new booking flag
      const newBookingCreated = typeof window !== 'undefined' ? localStorage.getItem('new-booking-created') : null;
      const newBookingId = typeof window !== 'undefined' ? localStorage.getItem('new-booking-id') : null;
      
      const [hotelsRes, bookingsRes] = await Promise.all([
        fetch('/api/hotels?limit=8'),
        fetch('/api/bookings?limit=5&sortBy=createdAt&order=desc'), // Ensure newest first
      ]);

      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        setHotels(data.hotels || []);
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        let bookings = data.bookings || [];
        
        // If there's a new booking, ensure it's at the top
        if (newBookingCreated && newBookingId) {
          const newBookingIndex = bookings.findIndex((b: any) => b.id === newBookingId);
          if (newBookingIndex > 0) {
            // Move new booking to top
            const newBooking = bookings.splice(newBookingIndex, 1)[0];
            bookings.unshift(newBooking);
          }
          
          // Clear the flags after processing
          if (typeof window !== 'undefined') {
            localStorage.removeItem('new-booking-created');
            localStorage.removeItem('new-booking-id');
            localStorage.removeItem('new-booking-timestamp');
          }
        }
        
        setBookings(bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectedHotelObj = hotels.find(h => h.id === selectedHotel) || null;
  const selectedRoomObj = selectedHotelObj?.rooms?.find(r => r.id === selectedRoom) || null;

  const getAvailabilityMeta = (hotel: Hotel) => {
    const roomCount = hotel.room_count ?? 0;
    const capacity = hotel.total_capacity ?? 0;

    return {
      hasAvailability: roomCount > 0,
      roomCount,
      capacity,
      text: roomCount > 0 ? 'Available' : 'No rooms available'
    };
  };

  const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
  const totalBookings = activeBookings.length;
  const totalSpent = activeBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  // Sort active bookings by most recent booking time (createdAt) for stats
  const sortedActiveBookingsByCreated = [...activeBookings].sort((a, b) =>
    new Date(b.createdAt || b.checkInDate).getTime() - new Date(a.createdAt || a.checkInDate).getTime()
  );

  // Upcoming bookings: future, in-progress, or completed (recent), sorted by soonest check-in first
  const upcomingBookings = activeBookings
    .filter(booking => {
      const { label } = getStayProgress(booking.checkInDate, booking.checkOutDate);
      return label === 'Upcoming' || label === 'In progress' || label === 'Completed';
    })
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

  // Sort all bookings (including cancelled) by creation time, most recent first
  const sortedBookingsByCreated = [...bookings].sort((a, b) =>
    new Date(b.createdAt || b.checkInDate).getTime() - new Date(a.createdAt || a.checkInDate).getTime()
  );

  function getStayProgress (checkInDate: string, checkOutDate: string) {
    const now = new Date();
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (now <= start) return { percent: 0, label: 'Upcoming' };
    if (now >= end) return { percent: 100, label: 'Completed' };

    const percent = Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
    return { percent, label: 'In progress' };
  };

  const getNights = (checkInDate: string, checkOutDate: string) =>
    Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000);

  // New utility for formatting booking creation time
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ' at ' +
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenBooking = async (hotelId: string) => {
    const res = await fetch(`/api/hotels/${hotelId}`);
    const hotelDetail = await res.json();

    setHotels(prev =>
      prev.map(h => (h.id === hotelId ? hotelDetail : h))
    );

    setSelectedHotel(hotelId);
    const firstAvailable = hotelDetail.rooms?.find((r: Room) => (r.availableUnits ?? 0) > 0);
    setSelectedRoom(firstAvailable?.id || null);
    setModalOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!session?.user?.customerId || !selectedHotel || !selectedRoom) return;

    try {
      setBookingSubmitting(true);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: selectedHotel,
          roomId: selectedRoom,
          customerId: session.user.customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests: guests,
          numberOfRooms: roomCount,
          specialRequests,
          paymentMethod: 'PAY_AT_HOTEL',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Booking failed');
        return;
      }

      const successData = await response.json();


      setModalOpen(false);
      setSpecialRequests('');
      setCheckInDate('');
      setCheckOutDate('');
      setGuests(1);
      setRoomCount(1);
      await loadHotelsAndBookings();
      setShowSuccessBanner(true);
    } catch (err) {
      console.error(err);
      alert('An error occurred while booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (!isMounted || status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Please log in to view your dashboard.</div>;

  return ( 
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {session.user?.name}</h1>
        <div className="flex space-x-3">
          <Link href="/hotels" className="btn btn-primary shadow-none">
            <IconPlus className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
            Book a Hotel
          </Link>
        </div>
      </div>

      {/* Quick Stats - updated to use createdAt for "latest/last booking" where possible */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="panel h-full">
          <div className="text-lg font-semibold text-black dark:text-gray-400">Total Bookings</div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3 text-black dark:text-gray-400">{totalBookings}</div>
            <div className="badge bg-success/20 text-success">Active</div>
          </div>
          <div className="mt-5 flex items-center font-semibold">
            <IconCalendar className="h-5 w-5 text-primary ltr:mr-2 rtl:ml-2" />
            <span className="text-white-dark">
              Latest booked: {formatDateTime(sortedActiveBookingsByCreated[0]?.createdAt || sortedActiveBookingsByCreated[0]?.checkInDate)}
            </span>
          </div>
        </div>

        {/* Other stats remain unchanged */}
        <div className="panel h-full">
          <div className="text-lg font-semibold text-black dark:text-gray-400">Available Hotels</div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3 text-black dark:text-gray-400">{hotels.length}</div>
          </div>
          <div className="mt-5">
            <Link href="/hotels" className="text-primary hover:underline">Browse Hotels</Link>
          </div>
        </div>

        <div className="panel h-full">
          <div className="text-lg font-semibold text-black dark:text-gray-400">Reward Points</div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3 text-black dark:text-gray-400"></div>
            <div className="badge bg-info/20 text-info">Coming soon</div>
          </div>
        </div>

        <div className="panel h-full">
          <div className="text-lg font-semibold text-black dark:text-gray-400">Total Spent</div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3 text-black dark:text-gray-400">₦{totalSpent.toLocaleString()}</div>
          </div>
          <div className="mt-5 flex items-center font-semibold">
            <IconClock className="h-5 w-5 text-primary ltr:mr-2 rtl:ml-2" />
            <span className="text-white-dark">
              Last booking: {formatDateTime(sortedActiveBookingsByCreated[0]?.createdAt || sortedActiveBookingsByCreated[0]?.checkInDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Dashboard */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="text-lg font-semibold dark:text-white-light">Notifications</h5>
          <Link href="/customer/notifications" className="text-primary hover:underline">View All</Link>
        </div>
        <NotificationDashboard />
      </div>

      {/* Recent Bookings - shows most recent booking regardless of status */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="text-lg font-semibold dark:text-white-light">Recent Bookings</h5>
          <Link href="/customer/bookings" className="text-primary hover:underline">View All</Link>
        </div>
        {sortedBookingsByCreated.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <CalendarIcon className="mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings</h3>
            <p className="mt-2 text-sm text-black dark:text-gray-400">
              You don't have any bookings at the moment.
            </p>
            <Link
              href="/hotels"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Browse Hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookingsByCreated.slice(0, 1).map((booking) => {
              const hotel = hotels.find((h) => h.id === booking.hotelId);
              const { percent, label } = getStayProgress(booking.checkInDate, booking.checkOutDate);

              return (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="p-6">
                    {/* Header with Hotel Name and Status */}
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {hotel?.name || booking.hotelId}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-black dark:text-gray-400">
                          <MapPin className="mr-1 h-4 w-4" />
                          <span>
                            {hotel ? [hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : booking.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Room with name fallback */}
                      <div>
                        <p className="text-sm font-medium text-black dark:text-gray-400">Room</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {booking.roomName ?? booking.roomId}{' '}
                          ({booking.numberOfGuests || 1} guest{booking.numberOfGuests !== 1 ? 's' : ''})
                        </p>
                      </div>

                      {/* Dates */}
                      <div>
                        <p className="text-sm font-medium text-black dark:text-gray-400">Stay Dates</p>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-4 w-4 text-gray-400" />
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                          </p>
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div>
                        <p className="text-sm font-medium text-black dark:text-gray-400">Total Amount</p>
                        <p className="font-bold text-primary">
                          ₦{Number(booking.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>

                      {/* Booking ID */}
                      <div>
                        <p className="text-sm font-medium text-black dark:text-gray-400">Booking ID</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          #{booking.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>

                      {/* Booked On */}
                      <div>
                        <p className="text-sm font-medium text-black dark:text-gray-400">Booked On</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDateTime(booking.createdAt)}
                        </p>
                      </div>

                      {/* Stay Progress - only show if not cancelled */}
                      {booking.status !== 'CANCELLED' && (
                        <div>
                          <p className="mb-1 text-sm font-medium text-black dark:text-gray-400">
                            Stay Progress
                          </p>
                          <div className="flex items-center justify-between text-xs text-black dark:text-gray-400 mb-1">
                            <span>{label}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Link
                        href={`/customer/bookings/${booking.id}`}
                        className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Hotels */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="text-lg font-semibold dark:text-white-light">Recommended Hotels</h5>
          <Link href="/hotels" className="text-primary hover:underline">Browse All</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hotels.map((hotel) => {
            const { hasAvailability, roomCount, capacity, text } = getAvailabilityMeta(hotel);
            return (
              <div key={hotel.id} className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="h-48 w-full overflow-hidden rounded-t-lg bg-gray-300">
                  <img
                    src={hotel.images?.[0] || '/assets/images/hotel-placeholder.jpg'}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-grow p-4">
                  <div className="flex-grow">
                    <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">{hotel.name}</h3>
                    <div className="mb-2 flex items-center text-sm text-black dark:text-gray-400">
                      <IconHome className="mr-1 h-4 w-4" />
                      {[hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ') || 'N/A'}
                    </div>
                    <div className="mb-3 flex items-center">
                      <div className="flex text-yellow-400 dark:text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(hotel.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      {/* <span className="ml-1 text-sm text-gray-500">{hotel.rating ?? ''}/5</span> */}
                    </div>
                    
                    {/* Availability Info */}
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <Bed className="mr-1 h-3.5 w-3.5" />
                        <span>{roomCount} room{roomCount !== 1 ? 's' : ''}</span>
                        <span className="mx-1">•</span>
                        <Users className="mr-1 h-3.5 w-3.5" />
                        <span>{capacity} bed{capacity !== 1 ? 's' : ''}</span>
                      </div>
                      {hasAvailability && (
                        <div className="text-xs font-medium text-green-600 dark:text-green-400">
                          ✓ Available for booking
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Now Button - Always at bottom */}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary shadow-none w-full mt-auto"
                    onClick={() => handleOpenBooking(hotel.id)}
                    disabled={!hasAvailability}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
          {hotels.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500">No hotels found.</div>
          )}
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Room availability is updated in real-time. Prices and availability may change.
        </div>
      </div>

      {/* Quick Booking Modal */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" open={modalOpen} onClose={() => setModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0" />
          </Transition.Child>
          <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
            <div className="flex min-h-screen items-start justify-center px-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel as="div" className="panel my-8 w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                  <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                    <div className="text-lg font-bold">Quick Booking</div>
                    <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModalOpen(false)}>
                      <IconX />
                    </button>
                  </div>
                  <div className="p-5">
                    <form>
                      <div className="mb-5">
                        <label htmlFor="bookingHotel">Hotel</label>
                        <select
                          id="bookingHotel"
                          className="form-select"
                          value={selectedHotel || ''}
                          onChange={(e) => {
                            setSelectedHotel(e.target.value);
                            setSelectedRoom(null);
                            setRoomCount(1);
                          }}
                        >
                          <option value="">Select a hotel</option>
                          {hotels.map((hotel) => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="bookingRoom">Room Type</label>
                        <select
                          id="bookingRoom"
                          className="form-select"
                          value={selectedRoom || ''}
                          onChange={(e) => {
                            setSelectedRoom(e.target.value);
                            // Reset room count to 1 and it will be validated in the dropdown options
                            setRoomCount(1);
                          }}
                          disabled={!selectedHotelObj}
                        >
                          <option value="">Select a room type</option>
                          {selectedHotelObj?.rooms?.map((room) => (
                            <option key={room.id} value={room.id} disabled={(room.availableUnits ?? 0) === 0}>
                              {room.name} - ₦{room.pricePerNight?.toLocaleString()}/night ({room.availableUnits ?? 0} unit{(room.availableUnits ?? 0) !== 1 ? 's' : ''} available)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="checkInDate">Check-in Date</label>
                          <input
                            id="checkInDate"
                            type="date"
                            className="form-input"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="checkOutDate">Check-out Date</label>
                          <input
                            id="checkOutDate"
                            type="date"
                            className="form-input"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="guestCount">Number of Guests</label>
                          <select
                            id="guestCount"
                            className="form-select"
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="roomCount">Number of Rooms</label>
                          <select
                            id="roomCount"
                            className="form-select"
                            value={roomCount}
                            onChange={(e) => setRoomCount(Number(e.target.value))}
                          >
                            {Array.from(
                              { length: Math.min(5, selectedRoomObj?.availableUnits ?? 1) },
                              (_, i) => i + 1
                            ).map((n) => (
                              <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="specialRequests">Special Requests</label>
                        <textarea
                          id="specialRequests"
                          rows={3}
                          className="form-textarea"
                          placeholder="Any special requests or preferences?"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="mt-8 flex items-center justify-end gap-4">
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => setModalOpen(false)}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="btn rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            onClick={handleCreateBooking}
                          >
                            {bookingSubmitting ? 'Booking...' : 'Book Now'}
                          </button>
                        </div>
  
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
