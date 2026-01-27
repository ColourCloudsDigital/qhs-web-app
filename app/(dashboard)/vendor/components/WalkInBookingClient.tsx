'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import WalkInBookingForm from './WalkInBookingForm';

interface Hotel {
  id: string;
  name: string;
}

interface WalkInBookingClientProps {
  hotels: Hotel[];
  vendorId: string;
}

export default function WalkInBookingClient({ hotels, vendorId }: WalkInBookingClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Walk-in Bookings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create bookings for guests who walk in without prior reservations
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Walk-in Booking
        </Button>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          How to Create a Walk-in Booking
        </h3>
        <div className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>1. Click the "Create Walk-in Booking" button above</p>
          <p>2. Select the hotel and available room</p>
          <p>3. Choose check-in and check-out dates</p>
          <p>4. Enter guest information and contact details</p>
          <p>5. Upload guest ID and documents</p>
          <p>6. Process payment and complete the booking</p>
        </div>
      </div>

      {/* Recent Walk-in Bookings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Walk-in Bookings
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No recent walk-in bookings found.</p>
            <p className="text-sm mt-1">Walk-in bookings will appear here once created.</p>
          </div>
        </div>
      </div>

      {/* Walk-in Booking Form Modal */}
      <WalkInBookingForm
        hotels={hotels}
        vendorId={vendorId}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}