'use client';

import { useState } from 'react';
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
  
  // Handle status selection
  const handleStatusSelection = (status: BookingStatus) => {
    setSelectedStatus(status);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      return;
    }
    
    try {
      await onUpdateStatus(selectedStatus);
      setSelectedStatus(null);
      setNotes('');
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  
  // Determine available status options based on current status
  const getAvailableStatuses = (): { status: BookingStatus; label: string; icon: JSX.Element }[] => {
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
        return [];
    }
  };
  
  const availableStatuses = getAvailableStatuses();
  
  if (!isOpen) {
    return null;
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
              {availableStatuses.map((option) => (
                <button
                  key={option.status}
                  type="button"
                  onClick={() => handleStatusSelection(option.status)}
                  className={`flex w-full items-center rounded-md border p-3 ${
                    selectedStatus === option.status
                      ? 'border-primary bg-primary-50 dark:border-primary dark:bg-primary/20'
                      : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className={`rounded-full p-1 ${
                    selectedStatus === option.status
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300'
                  }`}>
                    {option.icon}
                  </div>
                  <span className={`ml-3 font-medium ${
                    selectedStatus === option.status
                      ? 'text-primary dark:text-primary-light' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
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