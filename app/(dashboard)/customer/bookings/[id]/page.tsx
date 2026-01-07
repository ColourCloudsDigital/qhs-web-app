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
  X,
  RefreshCw,
  Edit3
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
  hotel?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    images: string[];
  };
  room?: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    pricePerNight: number;
    images: string[];
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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
  availableUnits: number;
  totalUnits: number;
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
  const [refreshingAvailability, setRefreshingAvailability] = useState(false);

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
        if (bookingRes.status === 403) {
          throw new Error('You do not have permission to view this booking');
        }
        throw new Error('Failed to fetch booking details');
      }

      const bookingData = await bookingRes.json();

      // Validate booking data structure
      if (!bookingData || typeof bookingData !== 'object') {
        throw new Error('Invalid booking data received');
      }

      setBooking(bookingData);
      console.log('Booking data loaded:', bookingData.id);

      // Only fetch available rooms if we have hotel information
      const hotelId = bookingData.hotelId || bookingData.hotel?.id;
      if (hotelId) {
        // Fetch current availability (not historical booking period availability)
        await fetchAvailableRooms(hotelId);
      }

      // Show success toast if this was just created
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
      const errorMessage = err.message || 'Failed to load booking details';
      setError(errorMessage);
      console.error('Error fetching booking:', err);

      // Show error toast for API errors
      if (!errorMessage.includes('not found') && !errorMessage.includes('permission')) {
        toast.error(errorMessage, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (hotelId: string) => {
    if (!hotelId) {
      console.warn('No hotel ID provided for fetching available rooms');
      setAvailableRooms([]);
      return;
    }

    try {
      setRefreshingAvailability(true);

      // Get current date + 30 days for availability check
      const checkInDate = new Date().toISOString().split('T')[0];
      const checkOutDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const url = `/api/hotels/${encodeURIComponent(hotelId)}/available-rooms?checkInDate=${encodeURIComponent(
        checkInDate
      )}&checkOutDate=${encodeURIComponent(checkOutDate)}`;

      console.log('Fetching current available rooms:', url);

      const response = await fetch(url);

      if (response.ok) {
        const roomsData = await response.json();

        // Validate rooms data structure
        if (Array.isArray(roomsData)) {
          setAvailableRooms(roomsData);
          console.log(`Loaded ${roomsData.length} available rooms`);
        } else {
          console.warn('Invalid rooms data structure:', roomsData);
          setAvailableRooms([]);
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Failed to fetch available rooms:', response.status, errorText);
        setAvailableRooms([]);
      }
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      setAvailableRooms([]);
    } finally {
      setRefreshingAvailability(false);
    }
  };

  const refreshAvailability = async () => {
    if (booking?.hotelId || booking?.hotel?.id) {
      const hotelId = booking.hotelId || booking.hotel?.id;
      if (hotelId) {
        await fetchAvailableRooms(hotelId);
        toast.success('Room availability refreshed', {
          duration: 2000,
          position: 'bottom-center',
        });
      }
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    if (cancelReason.trim().length < 10) {
      toast.error('Please provide a more detailed reason (at least 10 characters)', {
        duration: 3000,
        position: 'bottom-center',
      });
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Cancellation failed (${response.status})`;

        // Handle specific error cases
        if (response.status === 400 && errorMessage.includes('already cancelled')) {
          toast.error('This booking is already cancelled', {
            duration: 4000,
            position: 'bottom-center',
          });
          setShowCancelDialog(false);
          setCancelReason('');
          // Refresh the page to show updated status
          setTimeout(() => window.location.reload(), 1000);
          return;
        }

        if (response.status === 403) {
          toast.error('You do not have permission to cancel this booking', {
            duration: 4000,
            position: 'bottom-center',
          });
          return;
        }

        throw new Error(errorMessage);
      }

      const cancelledBooking = await response.json();

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

      // Update local booking state
      setBooking(cancelledBooking);

      // Redirect to bookings list after a short delay
      setTimeout(() => {
        router.push('/customer/bookings');
      }, 2500);

    } catch (err: any) {
      console.error('Cancellation error:', err);
      toast.error(err.message || 'Failed to cancel booking', {
        duration: 5000,
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

  const canModifyBooking = () => {
    if (!booking) return false;

    // Can only modify if booking is PENDING
    return booking.status.toUpperCase() === 'PENDING';
  };

  const getBookingActions = () => {
    if (!booking) return [];

    const actions = [];
    const status = booking.status.toUpperCase();

    // Cancel action
    if (canCancelBooking()) {
      actions.push({
        type: 'cancel',
        label: 'Cancel Booking',
        icon: Trash2,
        variant: 'danger' as const,
        action: () => setShowCancelDialog(true)
      });
    }

    // View confirmation (only for confirmed bookings)
    if (status === 'CONFIRMED') {
      actions.push({
        type: 'confirmation',
        label: 'View Confirmation',
        icon: CheckCircle,
        variant: 'primary' as const,
        action: () => {
          // For now, show a toast since the confirmation page doesn't exist
          toast('Confirmation feature coming soon!', {
            duration: 3000,
            position: 'bottom-center',
            style: {
              background: '#3B82F6',
              color: '#fff',
              fontWeight: '500',
            },
          });
        }
      });
    }

    // Modify booking (only for pending bookings)
    if (canModifyBooking()) {
      actions.push({
        type: 'modify',
        label: 'Modify Booking',
        icon: Edit3,
        variant: 'secondary' as const,
        action: () => {
          toast('Booking modification feature coming soon!', {
            duration: 3000,
            position: 'bottom-center',
            style: {
              background: '#3B82F6',
              color: '#fff',
              fontWeight: '500',
            },
          });
        }
      });
    }

    return actions;
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

  // Safely calculate dates and nights
  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Safe access to nested properties
  const hotelName = booking.hotel?.name || booking.hotelId || 'Hotel';
  const hotelAddress = booking.hotel?.address || '';
  const hotelLocation = booking.hotel ? [booking.hotel.city, booking.hotel.state, booking.hotel.country].filter(Boolean).join(', ') : 'Location not specified';
  const roomName = booking.room?.name || booking.roomId || 'Room';
  const roomType = booking.room?.type || 'Standard Room';
  const roomCapacity = booking.room?.capacity || booking.numberOfGuests || 1;
  const roomPrice = booking.room?.pricePerNight || 0;

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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{hotelName}</h3>
              <p className="text-gray-600 text-sm mb-1">
                {hotelAddress}
              </p>
              <p className="text-gray-600 text-sm">
                {hotelLocation}
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
            <h4 className="text-xl font-medium text-gray-900 mb-1">{roomName}</h4>
            <p className="text-gray-600 mb-2">{roomType}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Capacity: {roomCapacity} guest{roomCapacity !== 1 ? 's' : ''}</span>
              <span>{formatCurrency(roomPrice)} / night</span>
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

      {/* Current Room Availability */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Current Room Availability
          </h3>
          {(booking?.hotelId || booking?.hotel?.id) && (
            <button
              onClick={refreshAvailability}
              disabled={refreshingAvailability}
              className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshingAvailability ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        <p className="text-gray-600 mb-6">
          Current availability at {hotelName} for the next 30 days.
          {booking.room && (
            <span className="block mt-1 text-sm text-blue-600">
              Your booked room: <strong>{roomName}</strong> ({roomType})
            </span>
          )}
        </p>

        {availableRooms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableRooms.slice(0, 6).map((room) => (
              <div key={room.id} className={`border rounded-lg p-4 transition-shadow ${
                room.available
                  ? 'border-green-200 bg-green-50 hover:shadow-md'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{room.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    room.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {room.available ? 'Available' : 'Fully Booked'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{room.type}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {room.availableUnits}/{room.totalUnits} units available
                  </span>
                  <span className="font-medium text-primary">{formatCurrency(room.pricePerNight)}/night</span>
                </div>
                {room.capacity && (
                  <div className="mt-2 text-xs text-gray-500">
                    Up to {room.capacity} guests
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Unable to load current room availability.</p>
            {refreshingAvailability ? (
              <p className="text-sm text-gray-400">Refreshing...</p>
            ) : (
              <button
                onClick={refreshAvailability}
                className="text-primary hover:underline text-sm"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {availableRooms.length > 6 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing 6 of {availableRooms.length} room types
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

        {/* Dynamic action buttons based on booking status */}
        {getBookingActions().map((action) => {
          const IconComponent = action.icon;
          const buttonClasses = action.variant === 'danger'
            ? "flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            : action.variant === 'primary'
            ? "flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            : "flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors";

          return (
            <button
              key={action.type}
              onClick={action.action}
              className={buttonClasses}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {action.label}
            </button>
          );
        })}

        {/* Refresh availability button */}
        {(booking?.hotelId || booking?.hotel?.id) && (
          <button
            onClick={refreshAvailability}
            disabled={refreshingAvailability}
            className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-100 disabled:text-blue-400 transition-colors"
            title="Refresh room availability"
          >
            <RefreshCw className={`h-4 w-4 ${refreshingAvailability ? 'animate-spin' : ''}`} />
          </button>
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