import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import toast from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';

interface Booking {
  id: string;
  customerName: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  totalAmount: number;
  status: string;
}

interface CheckInFormProps {
  hotelId: string;
  onSuccess?: () => void;
}

export default function CheckInForm({ hotelId, onSuccess }: CheckInFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ID verification
  const [idType, setIdType] = useState('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  
  // Additional options
  const [issueKeycard, setIssueKeycard] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [notes, setNotes] = useState('');
  
  // Toast is imported from @/lib/toast

  // Search for bookings when query changes
  useEffect(() => {
    const searchBookings = async () => {
      if (!searchQuery || searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      
      try {
        setSearching(true);
        setError(null);
        
        const response = await fetch(
          `/api/vendor/hotels/${hotelId}/bookings/search?` +
          `query=${encodeURIComponent(searchQuery)}&status=CONFIRMED`
        );
        
        if (!response.ok) {
          throw new Error('Failed to search bookings');
        }
        
        const data = await response.json();
        setSearchResults(data.bookings);
      } catch (err) {
        console.error('Error searching bookings:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setSearching(false);
      }
    };
    
    const delaySearch = setTimeout(searchBookings, 500);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, hotelId]);

  // Select a booking from search results
  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle check-in submission
  const handleCheckIn = async () => {
    if (!selectedBooking) {
      toast.error("Please select a booking to check in", {
        title: "No booking selected"
      });
      return;
    }
    
    if (!idVerified) {
      toast.error("Please verify the guest's ID before checking in", {
        title: "ID verification required"
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendor/bookings/${selectedBooking.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idType,
          idNumber,
          issueKeycard,
          sendWelcomeEmail,
          notes,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check in guest');
      }
      
      toast.success(`${selectedBooking.customerName} has been checked in to room ${selectedBooking.roomNumber}`, {
        title: "Check-in successful"
      });
      
      // Reset form
      setSelectedBooking(null);
      setIdType('NIN');
      setIdNumber('');
      setIdVerified(false);
      setIssueKeycard(true);
      setSendWelcomeEmail(true);
      setNotes('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error checking in guest:', err);
      toast.error(err instanceof Error ? err.message : 'An error occurred during check-in', {
        title: "Check-in failed"
      });
      setError(err instanceof Error ? err.message : 'Failed to check in guest');
    } finally {
      setLoading(false);
    }
  };

  // Verify ID
  const handleVerifyId = () => {
    if (!idNumber || idNumber.length < 5) {
      toast.error('Please enter a valid ID number', {
            title: "Invalid ID"
          });
      return;
    }
    
    // In a real system, you would verify the ID with an external API
    // For now, we'll just simulate verification
    setIdVerified(true);
    toast.success("Guest ID has been verified", {
      title: "ID verification successful"
    });
  };

  return (
    <div className="space-y-4 py-4">
      {!selectedBooking ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-search">Search Bookings</Label>
            <div className="relative">
              <Input
                id="booking-search"
                placeholder="Enter booking ID or guest name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 shadow-sm dark:border-gray-700">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((booking) => (
                  <li 
                    key={booking.id}
                    className="cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSelectBooking(booking)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">{booking.customerName}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Room {booking.roomNumber} | {formatDate(booking.checkInDate)}
                        {' → '}{formatDate(booking.checkOutDate)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Booking ID: {booking.id}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {searchQuery && !searching && searchResults.length === 0 && (
            <div className="rounded-md bg-gray-50 p-3 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              No bookings found matching your search
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="flex flex-col">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                {selectedBooking.customerName}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Room {selectedBooking.roomNumber} | {formatDate(selectedBooking.checkInDate)}
                {' → '}{formatDate(selectedBooking.checkOutDate)}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Booking ID: {selectedBooking.id}
              </span>
              <div className="mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  onClick={() => setSelectedBooking(null)}
                >
                  Change Booking
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="id-type">ID Type</Label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger id="id-type">
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NIN">National ID (NIN)</SelectItem>
                <SelectItem value="PASSPORT">International Passport</SelectItem>
                <SelectItem value="DRIVERS_LICENSE">Driver&apos;s License</SelectItem>
                <SelectItem value="VOTERS_CARD">Voter&apos;s Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="id-number">ID Number</Label>
            <div className="flex gap-2">
              <Input
                id="id-number"
                placeholder="Enter ID number"
                value={idNumber}
                onChange={(e) => {
                  setIdNumber(e.target.value);
                  setIdVerified(false);
                }}
                disabled={idVerified}
              />
              <Button
                variant={idVerified ? "outline" : "default"}
                onClick={handleVerifyId}
                disabled={idVerified || !idNumber}
              >
                {idVerified ? "Verified" : "Verify"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="issue-keycard" 
                checked={issueKeycard} 
                onCheckedChange={(checked) => setIssueKeycard(checked as boolean)} 
              />
              <Label htmlFor="issue-keycard" className="text-sm font-normal">Issue keycard automatically</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-email" 
                checked={sendWelcomeEmail} 
                onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)} 
              />
              <Label htmlFor="send-email" className="text-sm font-normal">Send welcome email with WiFi details</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any special requirements or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCheckIn}
          disabled={!selectedBooking || !idVerified || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Check In Guest'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}