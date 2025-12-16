'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Icons
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconPlus from '@/components/icon/icon-plus';
import IconHome from '@/components/icon/icon-home';
import IconX from '@/components/icon/icon-x';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import IconSquareCheck from '@/components/icon/icon-square-check';

export default function CustomerDashboardPage() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sample hotels data
  const hotels = [
    { id: '1', name: 'Grand Plaza Hotel', location: 'Lagos', price: '₦25,000', rating: 4.8, image: '/assets/images/hotel1.jpg' },
    { id: '2', name: 'Sunset Resort', location: 'Abuja', price: '₦18,500', rating: 4.5, image: '/assets/images/hotel2.jpg' },
    { id: '3', name: 'Royal Suites', location: 'Port Harcourt', price: '₦32,000', rating: 4.7, image: '/assets/images/hotel3.jpg' },
    { id: '4', name: 'Lakeside Inn', location: 'Kaduna', price: '₦15,000', rating: 4.2, image: '/assets/images/hotel4.jpg' },
  ];

  // Sample bookings data
  const bookings = [
    { id: '#1234', hotel: 'Grand Plaza Hotel', room: 'Deluxe Room', checkIn: '15 Mar 2025', checkOut: '20 Mar 2025', amount: '₦125,000', status: 'Confirmed' },
    { id: '#1235', hotel: 'Sunset Resort', room: 'Standard Room', checkIn: '22 Apr 2025', checkOut: '25 Apr 2025', amount: '₦55,500', status: 'Pending' },
  ];

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {session.user?.name}</h1>
        <div className="flex space-x-3">
          <Link href="/hotels" className="btn btn-primary">
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
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">2</div>
            <div className="badge bg-success/20 text-success">Active</div>
          </div>
          <div className="mt-5 flex items-center font-semibold">
            <IconCalendar className="h-5 w-5 text-primary ltr:mr-2 rtl:ml-2" />
            <span className="text-white-dark">Next trip: 15 Mar 2025</span>
          </div>
        </div>

        <div className="panel h-full">
          <div className="flex justify-between">
            <div className="text-lg font-semibold ltr:mr-1 rtl:ml-1">Favorite Hotels</div>
          </div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">3</div>
          </div>
          <div className="mt-5">
            <Link href="/dashboard/favorites" className="text-primary hover:underline">View Favorites</Link>
          </div>
        </div>

        <div className="panel h-full">
          <div className="flex justify-between">
            <div className="text-lg font-semibold ltr:mr-1 rtl:ml-1">Reward Points</div>
          </div>
          <div className="mt-5 flex items-center">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">250</div>
            <div className="badge bg-info/20 text-info">+50 this month</div>
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
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">₦180,500</div>
          </div>
          <div className="mt-5 flex items-center font-semibold">
            <IconClock className="h-5 w-5 text-primary ltr:mr-2 rtl:ml-2" />
            <span className="text-white-dark">Last booking: 2 weeks ago</span>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="text-lg font-semibold dark:text-white-light">Upcoming Bookings</h5>
          <Link href="/dashboard/bookings" className="text-primary hover:underline">View All</Link>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.hotel}</td>
                  <td>{booking.room}</td>
                  <td>{booking.checkIn}</td>
                  <td>{booking.checkOut}</td>
                  <td>{booking.amount}</td>
                  <td>
                    <span className={`badge ${booking.status === 'Confirmed' ? 'bg-success' : 'bg-warning'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-sm btn-outline-primary">View</button>
                      <button type="button" className="btn btn-sm btn-outline-danger">Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4">No upcoming bookings found.</td>
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
                <img src={hotel.image || '/assets/images/hotel-placeholder.jpg'} alt={hotel.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="mb-1 text-lg font-semibold">{hotel.name}</h3>
                <div className="mb-2 flex items-center text-sm text-gray-500">
                  <IconHome className="mr-1 h-4 w-4" />
                  {hotel.location}
                </div>
                <div className="mb-3 flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(hotel.rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                  <span className="ml-1 text-sm text-gray-500">{hotel.rating}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-primary">{hotel.price}<span className="text-xs text-gray-500">/night</span></div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setSelectedHotel(hotel.id);
                      setModal1(true);
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Booking Modal */}
      <Transition appear show={modal1} as={Fragment}>
        <Dialog as="div" open={modal1} onClose={() => setModal1(false)}>
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
                    <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal1(false)}>
                      <IconX />
                    </button>
                  </div>
                  <div className="p-5">
                    <form>
                      <div className="mb-5">
                        <label htmlFor="bookingHotel">Hotel</label>
                        <select id="bookingHotel" className="form-select" value={selectedHotel || ''} onChange={(e) => setSelectedHotel(e.target.value)}>
                          <option value="">Select a hotel</option>
                          {hotels.map((hotel) => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name} - {hotel.location}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="bookingRoom">Room Type</label>
                        <select id="bookingRoom" className="form-select">
                          <option value="">Select a room type</option>
                          <option value="standard">Standard Room</option>
                          <option value="deluxe">Deluxe Room</option>
                          <option value="suite">Suite</option>
                          <option value="executive">Executive Suite</option>
                        </select>
                      </div>
                      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="checkInDate">Check-in Date</label>
                          <input id="checkInDate" type="date" className="form-input" />
                        </div>
                        <div>
                          <label htmlFor="checkOutDate">Check-out Date</label>
                          <input id="checkOutDate" type="date" className="form-input" />
                        </div>
                      </div>
                      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="guestCount">Number of Guests</label>
                          <select id="guestCount" className="form-select">
                            <option value="1">1 Guest</option>
                            <option value="2">2 Guests</option>
                            <option value="3">3 Guests</option>
                            <option value="4">4 Guests</option>
                            <option value="5">5+ Guests</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="roomCount">Number of Rooms</label>
                          <select id="roomCount" className="form-select">
                            <option value="1">1 Room</option>
                            <option value="2">2 Rooms</option>
                            <option value="3">3 Rooms</option>
                            <option value="4">4+ Rooms</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="specialRequests">Special Requests</label>
                        <textarea id="specialRequests" rows={3} className="form-textarea" placeholder="Any special requests or preferences?"></textarea>
                      </div>
                      <div className="mt-8 flex items-center justify-end">
                        <button type="button" className="btn btn-outline-danger" onClick={() => setModal1(false)}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={() => setModal1(false)}>
                          Book Now
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
