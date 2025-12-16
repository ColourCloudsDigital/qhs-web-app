'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Clock, 
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  CheckSquare,
  Printer,
  PenSquare,
  Briefcase,
  User
} from 'lucide-react';
import { BookingStatus, PaymentStatus } from '@/lib/types/enums';
import { formatCurrency, formatDate } from '@/lib/utils';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import PaymentStatusBadge from '../../components/PaymentStatusBadge';
import BookingActionButtons from '../../components/BookingActionButtons';
import CustomerInfoCard from '../../components/CustomerInfoCard';
import BookingRoomDetails from '../../components/BookingRoomDetails';
import BookingPaymentDetails from '../../components/BookingPaymentDetails';
import BookingDocuments from '../../components/BookingDocuments';
import BookingNotes from '../../components/BookingNotes';
import BookingStatusUpdateModal from '../../components/BookingStatusUpdateModal';

interface BookingDetailClientProps {
  booking: any;
  vendorId: string;
}

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'customer', label: 'Customer' },
  { key: 'payment', label: 'Payment' },
  { key: 'documents', label: 'Documents' },
];

export default function BookingDetailClient({ 
  booking,
  vendorId
}: BookingDetailClientProps) {
  const router = useRouter();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [bookingData, setBookingData] = useState(booking);
  const [activeTab, setActiveTab] = useState<'details' | 'customer' | 'payment' | 'documents'>('details');

  // Calculate number of nights
  const checkInDate = new Date(bookingData.checkInDate);
  const checkOutDate = new Date(bookingData.checkOutDate);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handle booking status update
  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    setStatusUpdateLoading(true);
    
    try {
      const response = await fetch(`/api/bookings/${bookingData.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      const updatedBooking = await response.json();
      setBookingData({
        ...bookingData,
        status: updatedBooking.status,
      });
      
      setIsStatusModalOpen(false);
      router.refresh(); // Refresh the page to get updated data
    } catch (error) {
      console.error('Error updating booking status:', error);
      // Handle error (show error message)
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Actions Card */}
      <div className="grid gap-6 print:block md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex flex-wrap items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Booking #{bookingData.id?.slice(0, 8).toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created on {formatDate(bookingData.createdAt)}
                </p>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                <BookingStatusBadge status={bookingData.status} />
                <PaymentStatusBadge status={bookingData.paymentStatus} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Check-in
                </h3>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(bookingData.checkInDate)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Check-out
                </h3>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(bookingData.checkOutDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="print:mt-6 md:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Actions
            </h3>
            
            <BookingActionButtons 
              booking={bookingData}
              onUpdateStatus={() => setIsStatusModalOpen(true)}
              onPrint={handlePrint}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium focus:outline-none transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light'
            }`}
            onClick={() => setActiveTab(tab.key as any)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Booking Details
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
          <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {nights} {nights === 1 ? 'night' : 'nights'} stay
                    </span>
          </div>
                  
                  <div className="mt-2 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {bookingData.numberOfGuests} {bookingData.numberOfGuests === 1 ? 'guest' : 'guests'}
                    </span>
        </div>
        
                  <div className="mt-2 flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Room: {bookingData.room?.name || 'N/A'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({bookingData.room?.type || 'N/A'})
                    </span>
          </div>
      </div>

                <div>
          <div className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Hotel: {bookingData.hotel?.name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Total: {formatCurrency(bookingData.totalAmount)}
                    </span>
                  </div>
                </div>
          </div>
        </div>
        
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-2 text-md font-semibold text-gray-900 dark:text-white">
                Room Details
              </h3>
            <BookingRoomDetails 
              room={bookingData.room} 
              hotel={bookingData.hotel}
              nights={nights}
              totalAmount={bookingData.totalAmount}
            />
            </div>
            
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-2 text-md font-semibold text-gray-900 dark:text-white">
                Special Requests & Notes
              </h3>
              <BookingNotes 
                booking={bookingData}
                setBookingData={setBookingData}
              />
            </div>
          </div>
        )}
        
        {/* Customer Tab */}
        {activeTab === 'customer' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customer Information
            </h3>
            <CustomerInfoCard customer={bookingData.customer} />
          </div>
        )}
        
        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Details
            </h3>
            <BookingPaymentDetails 
              booking={bookingData}
              payments={bookingData.payments || []}
            />
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Documents & ID
            </h3>
            <BookingDocuments bookingId={bookingData.id} />
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <BookingStatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onUpdateStatus={handleStatusUpdate}
        currentStatus={bookingData.status}
        isLoading={statusUpdateLoading}
      />
    </div>
  );
}