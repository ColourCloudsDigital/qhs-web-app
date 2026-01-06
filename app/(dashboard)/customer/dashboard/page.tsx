'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// Icons
import IconPlus from '@/components/icon/icon-plus';
import IconHome from '@/components/icon/icon-home';
import IconX from '@/components/icon/icon-x';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import { formatDate } from '@/lib/utils';

// Additional icons for booking cards
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

type Room = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
  availableUnits?: number;
};

type Booking = {
  id: string;
  hotelId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
};

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
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
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadHotelsAndBookings();
    }
  }, [status]);

  const loadHotelsAndBookings = async () => {
    try {
      setIsLoadingData(true);
      const [hotelsRes, bookingsRes] = await Promise.all([
        fetch('/api/hotels?limit=8'),
        fetch('/api/bookings?limit=5'),
      ]);

      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        setHotels(data.hotels || []);
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        // bookings route returns { bookings }
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectedHotelObj = hotels.find((h) => h.id === selectedHotel) || null;
  const selectedRoomObj = selectedHotelObj?.rooms?.find((r) => r.id === selectedRoom) || null;

  const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
  const totalBookings = activeBookings.length;
  const totalSpent = activeBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  // using shared formatDate from lib/utils

  // Helper function to calculate stay progress
  const getStayProgress = (checkInDate: string, checkOutDate: string) => {
    const now = new Date();
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return { percent: 0, label: 'Upcoming' };
    }
    if (now <= start) {
      return { percent: 0, label: 'Upcoming' };
    }
    if (now >= end) {
      return { percent: 100, label: 'Completed' };
    }
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
    return { percent, label: 'In progress' };
  };

  // Calculate nights stayed
  const getNights = (checkInDate: string, checkOutDate: string) => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleOpenBooking = async (hotelId: string) => {
    try {
      // Fetch full hotel details (includes per-room availability)
      const res = await fetch(`/api/hotels/${hotelId}`);
      if (!res.ok) throw new Error('Failed to load hotel details');

      const hotelDetail = await res.json();

      // Update hotels list with the detailed hotel so UI reflects accurate availability
      setHotels(prev => {
        const exists = prev.find(h => h.id === hotelId);
        if (!exists) return [hotelDetail, ...prev];
        return prev.map(h => (h.id === hotelId ? hotelDetail : h));
      });

      setSelectedHotel(hotelId);
      const firstAvailableRoom = (hotelDetail.rooms || []).find((r: any) => (r.availableUnits ?? 0) > 0) || hotelDetail.rooms?.[0];
      setSelectedRoom(firstAvailableRoom?.id || null);
      setModalOpen(true);
    } catch (err) {
      console.error('Unable to open booking modal:', err);
      alert('Unable to load hotel details for booking. Please try again.');
    }
  };

  const handleCreateBooking = async () => {
    if (!session?.user?.customerId || !selectedHotel || !selectedRoom || !checkInDate || !checkOutDate) {
      return;
    }
    try {
      setBookingSubmitting(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: selectedHotel,
          roomId: selectedRoom,
          customerId: session.user.customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests: guests,
          specialRequests,
          paymentMethod: 'PAY_AT_HOTEL',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create booking');
      }
      setModalOpen(false);
      setSpecialRequests('');
      setCheckInDate('');
      setCheckOutDate('');
      await loadHotelsAndBookings();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Unable to create booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (!isMounted || status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please log in to view your dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {session.user?.name}</h1>
        <div className="flex space-x-3">
          <Link href="/hotels" className="btn btn-primary shadow-none">
            <IconPlus className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
            Book a Hotel
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="panel h-full">
          <div className="flex justify-between">
            <div className="text-lg font-semibold ltr:mr-1 rtl:ml-1">Total Bookings</div>
          </div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{totalBookings}</div>
            <div className="badge bg-success/20 text-success">Active</div>
          </div>
          <div className="mt-5 flex items-center font-semibold">
            <IconCalendar className="h-5 w-5 text-primary ltr:mr-2 rtl:ml-2" />
            <span className="text-white-dark">Latest booking: {formatDate(activeBookings[0]?.checkInDate)}</span>
          </div>
        </div>

        <div className="panel h-full">
          <div className="flex justify-between">
            <div className="text-lg font-semibold ltr:mr-1 rtl:ml-1">Available Hotels</div>
          </div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{hotels.length}</div>
          </div>
          <div className="mt-5">
            <Link href="/hotels" className="text-primary hover:underline">Browse Hotels</Link>
          </div>
        </div>

        <div className="panel h-full">
          <div className="flex justify-between">
            <div className="text-lg font-semibold ltr:mr-1 rtl:ml-1">Reward Points</div>
          </div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">0</div>
            <div className="badge bg-info/20 text-info">Coming soon</div>
          </div>
          <div className="mt-5">
            <Link href="/dashboard/rewards" className="text-primary hover:underline">View Rewards</Link>
          </div>
        </div>

        <div className="panel h-full">
          <div className="flex justify-between">
            <div className="text-lg font-semibold ltr:mr-1 rtl:ml-1">Total Spent</div>
          </div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">₦{totalSpent.toLocaleString()}</div>
          </div>
          <div className="mt-5 flex items-center font-semibold">
            <IconClock className="h-5 w-5 text-primary ltr:mr-2 rtl:ml-2" />
            <span className="text-white-dark">Last booking: {formatDate(activeBookings[0]?.checkInDate)}</span>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="text-lg font-semibold dark:text-white-light">Upcoming Bookings</h5>
          <Link href="/customer/bookings" className="text-primary hover:underline">View All</Link>
        </div>

        {activeBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <CalendarIcon className="mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No upcoming bookings</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You don't have any upcoming bookings at the moment.
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
            {activeBookings.slice(0, 3).map((booking) => {
              const hotel = hotels.find((h) => h.id === booking.hotelId);
              const { percent, label } = getStayProgress(booking.checkInDate, booking.checkOutDate);
              const nights = getNights(booking.checkInDate, booking.checkOutDate);

              return (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="grid md:grid-cols-3">
                    {/* Hotel Image */}
                    <div className="relative h-48 w-full md:h-full">
                      {hotel?.images?.[0] ? (
                        <Image
                          src={hotel.images[0]}
                          alt={hotel.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <Hotel className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="p-6 md:col-span-2">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {hotel?.name || booking.hotelId}
                          </h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
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
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Room</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {booking.roomId} ({booking.numberOfGuests || 1} guest{booking.numberOfGuests !== 1 ? 's' : ''})
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</p>
                          <div className="flex items-center">
                            <CalendarIcon className="mr-1 h-4 w-4 text-gray-400" />
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                          <p className="font-bold text-primary">
                            ₦{Number(booking.totalAmount || 0).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Booking ID</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            #{booking.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>

                        {/* Stay progress */}
                        <div className="sm:col-span-2">
                          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Stay Progress
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
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
          {hotels.map((hotel) => (
            <div key={hotel.id} className="rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="h-48 w-full overflow-hidden rounded-t-lg bg-gray-300">
                <img
                  src={hotel.images?.[0] || '/assets/images/hotel-placeholder.jpg'}
                  alt={hotel.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">{hotel.name}</h3>
                <div className="mb-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-400">
                    {hotel.room_count && hotel.room_count > 0
                      ? `${hotel.room_count} room types • ${hotel.total_capacity || 0} bedspaces`
                      : 'No rooms available'}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary shadow-none"
                    onClick={() => handleOpenBooking(hotel.id)}
                    disabled={!hotel.room_count || hotel.room_count === 0}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
          {hotels.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500">No hotels found.</div>
          )}
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
                            const hotel = hotels.find((h) => h.id === e.target.value);
                            const firstAvailableRoom = hotel?.rooms?.find((r) => (r.availableUnits ?? 0) > 0) || hotel?.rooms?.[0];
                            setSelectedRoom(firstAvailableRoom?.id || null);
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
                          onChange={(e) => setSelectedRoom(e.target.value)}
                          disabled={!selectedHotelObj}
                        >
                          <option value="">Select a room type</option>
                          {selectedHotelObj?.rooms?.map((room) => (
                            <option key={room.id} value={room.id} disabled={(room.availableUnits ?? 0) === 0}>
                              {room.name} ({room.availableUnits ?? 0} available)
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
                          <input id="roomCount" className="form-input" value="1" disabled />
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
                            className="btn btn-primary"
                            onClick={handleCreateBooking}
                            disabled={bookingSubmitting}
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
