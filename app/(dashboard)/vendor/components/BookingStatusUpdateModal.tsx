'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  LogIn, 
  LogOut, 
  XCircle, 
  AlertTriangle,
  Loader
} from 'lucide-react';
import { BookingStatus } from '@/lib/types/enums';

interface BookingStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (status: BookingStatus) => Promise<void>;
  currentStatus: BookingStatus;
  isLoading: boolean;
}

export default function BookingStatusUpdateModal({
  isOpen,
  onClose,
  onUpdateStatus,
  currentStatus,
  isLoading
}: BookingStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [notes, setNotes] = useState('');
  
  // Reset state when modal opens/closes or currentStatus changes
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedStatus(null);
      setNotes('');
      console.log('Modal opened - state reset');
    }
  }, [isOpen, currentStatus]);
  
  // Handle status selection
  const handleStatusSelection = (status: BookingStatus) => {
    console.log('Status selected:', status);
    console.log('Current status:', currentStatus);
    console.log('Previous selected status:', selectedStatus);
    setSelectedStatus(status);
    console.log('New selected status will be:', status);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== Form Submission Debug ===');
    console.log('Form submitted with selectedStatus:', selectedStatus);
    
    if (!selectedStatus) {
      console.log('No status selected, aborting submission');
      return;
    }
    
    try {
      console.log('Calling onUpdateStatus with:', selectedStatus);
      await onUpdateStatus(selectedStatus);
      console.log('onUpdateStatus completed successfully');
      setSelectedStatus(null);
      setNotes('');
      console.log('Form state reset after successful update');
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  
  // Determine available status options based on current status
  const getAvailableStatuses = (): { status: BookingStatus; label: string; icon: JSX.Element }[] => {
    console.log('Getting available statuses for current status:', currentStatus);
    
    switch (currentStatus) {
      case BookingStatus.PENDING:
        return [
          { status: BookingStatus.CONFIRMED, label: 'Confirm Booking', icon: <CheckSquare className="h-5 w-5" /> },
          { status: BookingStatus.CANCELLED, label: 'Cancel Booking', icon: <XCircle className="h-5 w-5" /> }
        ];
      case BookingStatus.CONFIRMED:
        return [
          { status: BookingStatus.CHECKED_IN, label: 'Check In Guest', icon: <LogIn className="h-5 w-5" /> },
          { status: BookingStatus.CANCELLED, label: 'Cancel Booking', icon: <XCircle className="h-5 w-5" /> },
          { status: BookingStatus.NO_SHOW, label: 'Mark as No-Show', icon: <AlertTriangle className="h-5 w-5" /> }
        ];
      case BookingStatus.CHECKED_IN:
        return [
          { status: BookingStatus.CHECKED_OUT, label: 'Check Out Guest', icon: <LogOut className="h-5 w-5" /> }
        ];
      default:
        console.log('No available status transitions for:', currentStatus);
        return [];
    }
  };
  
  const availableStatuses = getAvailableStatuses();
  
  console.log('=== Modal State Debug ===');
  console.log('isOpen:', isOpen);
  console.log('currentStatus:', currentStatus);
  console.log('Available statuses:', availableStatuses);
  console.log('Selected status:', selectedStatus);
  console.log('isLoading:', isLoading);
  console.log('========================');
  
  if (!isOpen) {
    return null;
  }
  
  // Add validation to ensure we have valid statuses
  if (availableStatuses.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Update Booking Status
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            No status updates are available for the current booking status: <strong>{currentStatus}</strong>
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Update Booking Status
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select New Status:
            </label>
            <div className="space-y-2">
              {availableStatuses.map((option) => {
                const isSelected = selectedStatus === option.status;
                console.log(`Rendering button for ${option.status}, isSelected: ${isSelected}`);
                
                return (
                  <button
                    key={option.status}
                    type="button"
                    onClick={() => {
                      console.log('=== Button Click Debug ===');
                      console.log('Button clicked for status:', option.status);
                      console.log('Current selectedStatus before click:', selectedStatus);
                      handleStatusSelection(option.status);
                      console.log('handleStatusSelection called');
                      console.log('========================');
                    }}
                    className={`flex w-full items-center rounded-md border p-3 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary-50 dark:border-primary dark:bg-primary/20'
                        : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className={`rounded-full p-1 transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {option.icon}
                    </div>
                    <span className={`ml-3 font-medium transition-all duration-200 ${
                      isSelected
                        ? 'text-primary dark:text-primary-light' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional):
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Add any notes about this status change..."
              rows={3}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!selectedStatus || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}