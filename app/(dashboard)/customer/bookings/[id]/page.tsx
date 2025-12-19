'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BookingDetailPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'booked' | 'free'>('all');

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const bookingsRes = await fetch('/api/bookings');
        const bookingsData = await bookingsRes.json();
        if (mounted) setBookings(bookingsData);

        const roomsRes = await fetch('/api/rooms');
        const roomsData = await roomsRes.json();
        if (mounted) setRooms(roomsData);
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  const hotelIds = Array.from(new Set([...rooms.map(r => r.hotelId), ...bookings.map(b => b.hotelId)]));

  const roomsByHotel = hotelIds.reduce((acc: any, h: any) => {
    acc[h] = rooms.filter((r: any) => r.hotelId === h);
    return acc;
  }, {});

  const bookingsByHotel = hotelIds.reduce((acc: any, h: any) => {
    acc[h] = bookings.filter((b: any) => b.hotelId === h);
    return acc;
  }, {});

  const currentDate = new Date('2025-12-19');

  const getStatus = (hotelId: any, roomId: any) => {
    const hBookings = bookingsByHotel[hotelId] || [];
    const isBooked = hBookings.some((b: any) => b.roomId === roomId && new Date(b.checkIn) <= currentDate && currentDate <= new Date(b.checkOut));
    return isBooked ? 'Booked' : 'Free';
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Bookings for the two hotels</h1>

      <div className="mt-4">
        <label>Filter rooms: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'booked' | 'free')}>
          <option value="all">All</option>
          <option value="booked">Booked</option>
          <option value="free">Free</option>
        </select>
      </div>

      {hotelIds.map((hotelId) => (
        <div key={hotelId} className="mt-4">
          <h2 className="text-lg font-medium">Hotel {hotelId}</h2>

          <h3>Rooms:</h3>
          <table className="table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Room ID</th>
                <th className="border border-gray-300 p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {roomsByHotel[hotelId]
                .filter((room: any) => {
                  const status = getStatus(hotelId, room.id);
                  if (filter === 'all') return true;
                  if (filter === 'booked') return status === 'Booked';
                  if (filter === 'free') return status === 'Free';
                  return true;
                })
                .map((room: any) => (
                  <tr key={room.id}>
                    <td className="border border-gray-300 p-2">{room.id}</td>
                    <td className="border border-gray-300 p-2">{getStatus(hotelId, room.id)}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <h3 className="mt-4">Bookings:</h3>
          <ul className="list-disc pl-6">
            {bookingsByHotel[hotelId].map((booking: any) => (
              <li key={booking.id}>
                Booking {booking.id} for room {booking.roomId} from {booking.checkIn} to {booking.checkOut}
                {' '}
                <Link href={`/customer/bookings/${booking.id}`} className="text-blue-500 underline">
                  Detail
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}