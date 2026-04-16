'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  LogIn, 
  LogOut, 
  XCircle, 
  AlertTriangle,
  Loader,
  Clock,
  CheckCircle,
  Ban
} from 'lucide-react';
import { BookingStatus } from '@/lib/types/enums';

interface BookingStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (status: BookingStatus) => Promise<void>;
  onApproveCancellation?: (action: 'approve' | 'decline') => Promise<void>;
  currentStatus: BookingStatus;
  isLoading: boolean;
  checkInDate?: string;
  checkOutDate?: string;
}

export default function BookingStatusUpdateModal({
  isOpen,
  onClose,
  onUpdateStatus,
  onApproveCancellation,
  currentStatus,
  isLoading,
  checkInDate,
  checkOutDate,
}: BookingStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [notes, setNotes] = useState('');

  // Date-aware helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = checkInDate ? new Date(checkInDate) : null;
  const checkOut = checkOutDate ? new Date(checkOutDate) : null;
  if (checkIn) checkIn.setHours(0, 0, 0, 0);
  if (checkOut) checkOut.setHours(0, 0, 0, 0);

  // Check-in is available on or after the check-in date
  const canCheckIn = !checkIn || today >= checkIn;
  // No-show is available only after the check-out date has passed
  const isNoShow = checkOut ? today > checkOut : false;
  
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
      setNotes('');
    }
  }, [isOpen, currentStatus]);

  const handleStatusSelection = (status: BookingStatus) => {
    setSelectedStatus(status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;
    try {
      await onUpdateStatus(selectedStatus);
      setSelectedStatus(null);
      setNotes('');
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  
  const getAvailableStatuses = (): { status: BookingStatus; label: string; icon: JSX.Element; disabled?: boolean; hint?: string }[] => {
    switch (currentStatus) {
      case BookingStatus.PENDING:
        return [
          { status: BookingStatus.CONFIRMED, label: 'Confirm Booking', icon: <CheckSquare className="h-5 w-5" /> },
          { status: BookingStatus.CANCELLED, label: 'Cancel Booking', icon: <XCircle className="h-5 w-5" /> },
        ];
      case BookingStatus.CONFIRMED:
        return [
          {
            status: BookingStatus.CHECKED_IN,
            label: 'Check In Guest',
            icon: <LogIn className="h-5 w-5" />,
            disabled: !canCheckIn,
            hint: !canCheckIn ? `Available from ${checkIn?.toLocaleDateString()}` : undefined,
          },
          { status: BookingStatus.CANCELLED, label: 'Cancel Booking', icon: <XCircle className="h-5 w-5" /> },
          {
            status: BookingStatus.NO_SHOW,
            label: 'Mark as No-Show',
            icon: <AlertTriangle className="h-5 w-5" />,
            disabled: !isNoShow,
            hint: !isNoShow ? 'Available after check-out date has passed' : undefined,
          },
        ];
      case BookingStatus.CHECKED_IN:
        return [
          { status: BookingStatus.CHECKED_OUT, label: 'Check Out Guest', icon: <LogOut className="h-5 w-5" /> },
        ];
      case BookingStatus.CANCELLATION_REQUESTED:
        return [];
      default:
        return [];
    }
  };
  
  const availableStatuses = getAvailableStatuses();

  if (!isOpen) return null;
  
  // Cancellation request — show approve/decline UI
  if (currentStatus === BookingStatus.CANCELLATION_REQUESTED) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Cancellation Request
          </h2>
          <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
            A staff member has requested to cancel this booking. Do you want to approve or decline this request?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onApproveCancellation?.('approve')}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <><Loader className="h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <><CheckCircle className="h-4 w-4" />Approve Cancellation</>
              )}
            </button>
            <button
              type="button"
              onClick={() => onApproveCancellation?.('decline')}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <><Ban className="h-4 w-4" />Decline</>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
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
                return (
                  <button
                    key={option.status}
                    type="button"
                    onClick={() => !option.disabled && handleStatusSelection(option.status)}
                    disabled={option.disabled}
                    className={`flex w-full flex-col rounded-md border p-3 transition-all duration-200 ${
                      option.disabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800'
                        : isSelected
                        ? 'border-primary bg-primary-50 dark:border-primary dark:bg-primary/20'
                        : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`rounded-full p-1 ${
                        option.disabled ? 'bg-gray-100 text-gray-400' :
                        isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {option.icon}
                      </div>
                      <span className={`ml-3 font-medium ${
                        option.disabled ? 'text-gray-400' :
                        isSelected ? 'text-primary dark:text-primary-light' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    {option.hint && (
                      <p className="mt-1 pl-9 text-xs text-gray-400">{option.hint}</p>
                    )}
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