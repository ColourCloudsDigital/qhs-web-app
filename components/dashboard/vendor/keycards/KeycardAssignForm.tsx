'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/services/toast.service';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  room: {
    id: string;
    name: string;
  };
  customer: {
    user: {
      name: string;
    };
  };
  checkInDate: string;
  checkOutDate: string;
}

interface Staff {
  id: string;
  user: {
    name: string;
  };
  position: string;
}

interface Lock {
  id: string;
  roomId: string | null;
  serialNumber: string;
  room: {
    id: string;
    name: string;
  } | null;
}

interface Keycard {
  id: string;
  cardNumber: string;
  cardType: string;
  lock: Lock | null;
}

interface KeycardAssignFormProps {
  keycard: Keycard;
  hotelId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function KeycardAssignForm({
  keycard,
  hotelId,
  onSuccess,
  onCancel
}: KeycardAssignFormProps) {
  const [assignTo, setAssignTo] = useState('booking');
  const [bookingId, setBookingId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [accessLevel, setAccessLevel] = useState('1');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Format today and one year from now as default date values
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    
    setValidFrom(today.toISOString().split('T')[0]);
    setValidTo(nextYear.toISOString().split('T')[0]);
    
    // Load data based on the active tab
    if (assignTo === 'booking') {
      fetchBookings();
    } else {
      fetchStaff();
    }
  }, [hotelId, assignTo]);

  const fetchBookings = async () => {
    setLoadingData(true);
    try {
      // Only fetch bookings that match the lock's room if the keycard is configured for a lock with a room
      let url = `/api/bookings?hotelId=${hotelId}&status=CONFIRMED`;
      if (keycard.lock?.roomId) {
        url += `&roomId=${keycard.lock.roomId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`/api/staff?hotelId=${hotelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (assignTo === 'booking' && !bookingId) {
      setError('Please select a booking');
      return;
    }
    
    if (assignTo === 'staff' && !staffId) {
      setError('Please select a staff member');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let url = `/api/keycards/${keycard.id}/assign`;
      let body: Record<string, any> = {};
      
      if (assignTo === 'booking') {
        body = {
          type: 'booking',
          bookingId
        };
      } else {
        body = {
          type: 'staff',
          staffId,
          accessLevel: parseInt(accessLevel),
          validFrom,
          validTo
        };
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign keycard');
      }
      
      toast.success(`Keycard has been assigned to ${assignTo === 'booking' ? 'booking' : 'staff member'}.`);
      
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning keycard:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // use shared formatDate from utils

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Keycard:</span>
            <span>{keycard.cardNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Type:</span>
            <span>{keycard.cardType.charAt(0).toUpperCase() + keycard.cardType.slice(1).toLowerCase()}</span>
          </div>
          {keycard.lock && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Configured for lock:</span>
              <span>
                {keycard.lock.serialNumber} 
                {keycard.lock.room ? ` (Room: ${keycard.lock.room.name})` : ''}
              </span>
            </div>
          )}
        </div>
        
        <Tabs value={assignTo} onValueChange={setAssignTo} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="booking">Assign to Booking</TabsTrigger>
            <TabsTrigger value="staff">Assign to Staff</TabsTrigger>
          </TabsList>
          
          <TabsContent value="booking" className="space-y-4 pt-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bookingId" className="text-right">
                Select Booking
              </Label>
              <Select
                value={bookingId}
                onValueChange={setBookingId}
                disabled={loadingData}
              >
                <SelectTrigger id="bookingId" className="col-span-3">
                  <SelectValue placeholder="Select a booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.customer.user.name} - {booking.room.name} 
                      ({formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {keycard.lock?.roomId && bookings.length === 0 && (
              <div className="text-sm text-amber-600">
                No active bookings found for room: {keycard.lock.room?.name || ''}. Make sure there are active bookings for this room.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="staff" className="space-y-4 pt-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffId" className="text-right">
                Select Staff
              </Label>
              <Select
                value={staffId}
                onValueChange={setStaffId}
                disabled={loadingData}
              >
                <SelectTrigger id="staffId" className="col-span-3">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.user?.name || 'Unknown'} - {staffMember.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accessLevel" className="text-right">
                Access Level
              </Label>
              <Select
                value={accessLevel}
                onValueChange={setAccessLevel}
              >
                <SelectTrigger id="accessLevel" className="col-span-3">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1: Basic Access</SelectItem>
                  <SelectItem value="2">Level 2: Floor Access</SelectItem>
                  <SelectItem value="3">Level 3: Area Access</SelectItem>
                  <SelectItem value="4">Level 4: Building Access</SelectItem>
                  <SelectItem value="5">Level 5: Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="validFrom" className="text-right">
                Valid From
              </Label>
              <Input
                id="validFrom"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="validTo" className="text-right">
                Valid To
              </Label>
              <Input
                id="validTo"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="col-span-3"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="flex items-center rounded-md bg-destructive/15 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || loadingData || (assignTo === 'booking' && !bookingId) || (assignTo === 'staff' && !staffId)}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign Keycard
        </Button>
      </div>
    </form>
  );
}