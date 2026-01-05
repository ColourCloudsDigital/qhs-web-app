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

type Hotel = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  images?: string[];
  rating?: number | null;
  rooms?: Room[];
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

  const handleOpenBooking = (hotelId: string) => {
    setSelectedHotel(hotelId);
    const hotel = hotels.find((h) => h.id === hotelId);
    const firstAvailableRoom = hotel?.rooms?.find((r) => (r.availableUnits ?? 0) > 0) || hotel?.rooms?.[0];
    setSelectedRoom(firstAvailableRoom?.id || null);
    setModalOpen(true);
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
        <div className="table-responsive">
          <table className="w-full table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hotel</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.map((booking) => {
                const hotelName = hotels.find((h) => h.id === booking.hotelId)?.name || booking.hotelId;
                const roomName =
                  hotels
                    .find((h) => h.id === booking.hotelId)
                    ?.rooms?.find((r) => r.id === booking.roomId)?.name || booking.roomId;
                return (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{hotelName}</td>
                    <td>{roomName}</td>
                    <td>{formatDate(booking.checkInDate)}</td>
                    <td>{formatDate(booking.checkOutDate)}</td>
                    <td>₦{Number(booking.totalAmount || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${booking.status === 'CONFIRMED' ? 'bg-success' : 'bg-warning'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {activeBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4">No upcoming bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <h3 className="mb-1 text-lg font-semibold">{hotel.name}</h3>
                <div className="mb-2 flex items-center text-sm text-gray-500">
                  <IconHome className="mr-1 h-4 w-4" />
                  {[hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ') || 'N/A'}
                </div>
                <div className="mb-3 flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(hotel.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                  <span className="ml-1 text-sm text-gray-500">{hotel.rating ?? 'N/A'}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    {hotel.rooms && hotel.rooms.length > 0
                      ? `${hotel.rooms.length} room types • ${hotel.rooms.reduce((sum, r) => sum + (r.availableUnits || 0), 0)} bedspaces`
                      : 'No rooms available'}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleOpenBooking(hotel.id)}
                    disabled={!hotel.rooms || hotel.rooms.length === 0}
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
                      <div className="mt-8 flex items-center justify-end">
                        <button type="button" className="btn btn-outline-danger" onClick={() => setModalOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary ltr:ml-4 rtl:mr-4"
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
