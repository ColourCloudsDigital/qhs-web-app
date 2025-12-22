import { notFound } from 'next/navigation';
import { Check, Calendar, User, MapPin, Phone, CreditCard, FileText } from 'lucide-react';
import pool from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';
import PrintConfirmationButton from "@/components/PrintConfirmationButton";


interface BookingConfirmationProps {
  params: {
    id: string;
  };
}

interface BookingDetails extends RowDataPacket {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  specialRequests: string | null;
  createdAt: string;
  // Customer info
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  // Hotel and Room info
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelState: string;
  hotelCountry: string;
  roomName: string;
  roomType: string;
}

async function getBookingDetails(bookingId: string): Promise<BookingDetails | null> {
  try {
    const [rows] = await pool.query<BookingDetails[]>(
      `SELECT
        b.id, b.checkInDate, b.checkOutDate,
        b.numberOfGuests, b.totalAmount, b.paymentStatus,
        b.status, b.specialRequests, b.createdAt,
        c.firstName, c.lastName, c.phone,
        u.email,
        h.name AS hotelName, h.address AS hotelAddress,
        h.city AS hotelCity, h.state AS hotelState, h.country AS hotelCountry,
        r.name AS roomName
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.id = ?`,
      [bookingId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return null;
  }
}

export default async function BookingConfirmationPage({ params }: BookingConfirmationProps) {
  const booking = await getBookingDetails(params.id);

  if (!booking) {
    notFound();
  }

  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/30">
            <Check className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Booking Confirmed!</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your booking reference number is <span className="font-bold text-primary">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
          {/* Booking summary header */}
          <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Summary</h2>
          </div>

          {/* Booking details */}
          <div className="p-6">
            {/* Hotel & Room Info */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">{booking.hotelName}</h3>
              <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p>{booking.hotelAddress}</p>
                  <p>{booking.hotelCity}, {booking.hotelState}, {booking.hotelCountry}</p>
                </div>
              </div>
            </div>

            {/* Room & Date Info */}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Room Details</h4>
                <p className="text-gray-600 dark:text-gray-300">{booking.roomName} ({booking.roomType})</p>
                <p className="text-gray-600 dark:text-gray-300">{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'Guest' : 'Guests'}</p>
              </div>
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Stay Dates</h4>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p>Check-in: {formatDate(booking.checkInDate)}</p>
                    <p>Check-out: {formatDate(booking.checkOutDate)}</p>
                    <p className="mt-1">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Info */}
            <div className="mb-6">
              <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Guest Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <User className="h-5 w-5 flex-shrink-0" />
                  <span>{booking.firstName} {booking.lastName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <span>{booking.phone}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-6">
              <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Payment Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <CreditCard className="h-5 w-5 flex-shrink-0" />
                  <span>{booking.paymentStatus.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="mb-6">
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Special Requests</h4>
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <FileText className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p>{booking.specialRequests}</p>
                </div>
              </div>
            )}

            {/* Booking Status */}
            <div className="mt-8 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-400">
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Booked on {formatDate(booking.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          {booking.email && (
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              A confirmation email has been sent to {booking.email}
            </p>
          )}
          <div className="flex justify-center gap-4">
            <a
              href="/"
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Return to Home
            </a>
            <PrintConfirmationButton />
            </div>
        </div>
      </div>
    </main>
  );
} 