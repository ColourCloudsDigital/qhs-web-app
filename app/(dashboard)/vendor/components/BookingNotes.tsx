'use client';

import { useState } from 'react';
import { Loader, PlusCircle, Save, X } from 'lucide-react';

interface BookingNotesProps {
  booking: any;
  setBookingData: (data: any) => void;
}

export default function BookingNotes({ booking, setBookingData }: BookingNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(booking.specialRequests || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle save notes
  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ specialRequests: editedNotes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
      
      const updatedBooking = await response.json();
      
      // Update the booking data in the parent component
      setBookingData({
        ...booking,
        specialRequests: updatedBooking.specialRequests,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating notes:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditedNotes(booking.specialRequests || '');
    setIsEditing(false);
  };
  
  return (
    <div>
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            rows={6}
            placeholder="Enter special requests or notes for this booking..."
          />
          
          <div className="flex space-x-3">
            <button
              onClick={handleSaveNotes}
              disabled={isSubmitting}
              className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notes
                </>
              )}
            </button>
            
            <button
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {booking.specialRequests ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {booking.specialRequests}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No special requests or notes for this booking.
              </p>
            </div>
          )}
          
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {booking.specialRequests ? 'Edit Notes' : 'Add Notes'}
          </button>
        </div>
      )}
    </div>
  );
}