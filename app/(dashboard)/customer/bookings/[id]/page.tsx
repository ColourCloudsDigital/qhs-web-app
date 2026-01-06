'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  User,
  CreditCard,
  Bed,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
  Users,
  Trash2,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  customerId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
  hotel: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    images: string[];
  };
  room: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    pricePerNight: number;
    images: string[];
  };
}

interface RoomAvailability {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity: number;
  pricePerNight: number;
  available: boolean;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomAvailability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch booking details
      const bookingRes = await fetch(`/api/bookings/${bookingId}`);
      if (!bookingRes.ok) {
        if (bookingRes.status === 404) {
          throw new Error('Booking not found');
        }
        throw new Error('Failed to fetch booking details');
      }

      const bookingData = await bookingRes.json();
      setBooking(bookingData);

      // Debug log booking payload
      console.log('Booking data fetched:', bookingData);

      // Normalize hotel id and dates, backend expects hotelId param and YYYY-MM-DD dates
      const hotelId = bookingData.hotelId || bookingData.hotel?.id;
      const normalizeDate = (d: string) => new Date(d).toISOString().slice(0, 10);
      const checkIn = normalizeDate(bookingData.checkInDate);
      const checkOut = normalizeDate(bookingData.checkOutDate);

      // Fetch available rooms for the booking period (use backend's expected query names)
      await fetchAvailableRooms(hotelId, checkIn, checkOut);

      // Show success toast if this was just created (could be from URL params or localStorage)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        toast.success('Booking created successfully!', {
          duration: 4000,
          position: 'bottom-center',
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '500',
          },
        });
        // Clean up the URL
        window.history.replaceState({}, '', window.location.pathname);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (hotelId: string, checkInDate: string, checkOutDate: string) => {
    try {
      const url = `/api/hotels/${encodeURIComponent(hotelId)}/available-rooms?checkInDate=${encodeURIComponent(
        checkInDate
      )}&checkOutDate=${encodeURIComponent(checkOutDate)}`;
      console.log('Fetching available rooms URL:', url);
      const response = await fetch(url);

      if (response.ok) {
        const rooms = await response.json();
        setAvailableRooms(rooms);
      }
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      // Don't show error for this - it's not critical
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setIsCancelling(true);

      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully', {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
        },
      });

      setShowCancelDialog(false);
      setCancelReason('');

      // Redirect to bookings list after a short delay
      setTimeout(() => {
        router.push('/customer/bookings');
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking', {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
        },
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelBooking = () => {
    if (!booking) return false;

    // Can only cancel if booking is PENDING or CONFIRMED
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    return cancellableStatuses.includes(booking.status.toUpperCase());
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The booking you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.'}
          </p>
          <Link
            href="/customer/bookings"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center text-primary hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Bookings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600 mt-1">Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
              {booking.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.paymentStatus)}`}>
              {booking.paymentStatus.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Hotel Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.hotel.name}</h3>
              <p className="text-gray-600 text-sm mb-1">
                {booking.hotel.address}
              </p>
              <p className="text-gray-600 text-sm">
                {booking.hotel.city}, {booking.hotel.state}, {booking.hotel.country}
              </p>
            </div>
          </div>
        </div>

        {/* Stay Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{nights} night{nights !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Bed className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-medium text-gray-900 mb-1">{booking.room.name}</h4>
            <p className="text-gray-600 mb-2">{booking.room.type}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Capacity: {booking.room.capacity} guest{booking.room.capacity !== 1 ? 's' : ''}</span>
              <span>{formatCurrency(booking.room.pricePerNight)} / night</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{formatCurrency(booking.totalAmount)}</div>
            <div className="text-sm text-gray-500">Total amount</div>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      {booking.specialRequests && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Requests</h3>
          <p className="text-gray-700">{booking.specialRequests}</p>
        </div>
      )}

      {/* Available Rooms at Checkout Time */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Rooms During Your Stay
        </h3>
        <p className="text-gray-600 mb-6">
          These rooms were available at {booking.hotel.name} during your check-in and check-out period
          ({formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}).
        </p>

        {availableRooms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableRooms.slice(0, 6).map((room) => (
              <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{room.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    room.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {room.available ? 'Available' : 'Booked'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{room.type}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Up to {room.capacity} guests</span>
                  <span className="font-medium text-primary">{formatCurrency(room.pricePerNight)}/night</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No room availability information available for this period.</p>
          </div>
        )}

        {availableRooms.length > 6 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing 6 of {availableRooms.length} available rooms
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link
          href="/customer/bookings"
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Link>

        {canCancelBooking() && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Booking
          </button>
        )}

        {booking.status === 'CONFIRMED' && (
          <Link
            href={`/bookings/${booking.id}/confirmation`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            View Confirmation
          </Link>
        )}
      </div>

      {/* Cancel Booking Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Cancellation Policy
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Free cancellation up to 48 hours before check-in. Cancellations made within 48 hours may incur charges.
                    </p>
                  </div>
                </div>
              </div>

              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}