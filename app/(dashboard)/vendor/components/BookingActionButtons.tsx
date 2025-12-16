'use client';

import React from 'react';
import Link from 'next/link';
import { BookingStatus } from '@/lib/types/enums';
import { Button } from '@/components/ui/button';
import { 
  Pen, 
  Printer, 
  Ban, 
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface BookingActionButtonsProps {
  booking: any;
  onUpdateStatus: () => void;
  onPrint: () => void;
}

const BookingActionButtons = ({ 
  booking, 
  onUpdateStatus,
  onPrint
}: BookingActionButtonsProps) => {
  // Skip showing buttons that don't make sense for current status
  const showCancel = booking.status !== 'CANCELED' && booking.status !== 'COMPLETED';
  const showConfirm = booking.status === 'PENDING';
  const showCheckIn = booking.status === 'CONFIRMED';
  const showCheckOut = booking.status === 'CHECKED_IN';
  
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/vendor/bookings/edit/${booking.id}`} className="w-auto">
        <Button variant="outline" size="sm" className="flex items-center">
          <Pen className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </Link>
      
      <Button onClick={onPrint} variant="outline" size="sm" className="flex items-center">
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      
      <Button onClick={onUpdateStatus} variant="outline" size="sm" className="flex items-center">
        <AlertTriangle className="mr-2 h-4 w-4" />
        Update Status
      </Button>
      
      {showCancel && (
        <Button 
          variant="danger" 
          size="sm"
          className="flex items-center"
          onClick={onUpdateStatus}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
      
      {showConfirm && (
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center bg-green-600 hover:bg-green-700"
          onClick={onUpdateStatus}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirm
        </Button>
      )}
    </div>
  );
};

export default BookingActionButtons;