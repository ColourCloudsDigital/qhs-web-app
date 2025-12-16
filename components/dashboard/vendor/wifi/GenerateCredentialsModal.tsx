'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger, 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import toast from '@/lib/services/toast.service';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  customer: {
    user: {
      name: string;
    }
  }
}

interface Room {
  id: string;
  name: string;
  type: string;
}

interface GenerateCredentialsModalProps {
  hotelId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateCredentialsModal({
  hotelId,
  open,
  onClose,
  onSuccess,
}: GenerateCredentialsModalProps) {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validFrom, setValidFrom] = useState<Date>(new Date());
  const [validTo, setValidTo] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 1 week from now
  const [isActive, setIsActive] = useState(true);
  const [bookingId, setBookingId] = useState<string | undefined>(undefined);
  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  
  // Data fetching state
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active bookings when modal opens
  useEffect(() => {
    if (open && hotelId) {
      fetchBookings();
      fetchRooms();
    }
  }, [open, hotelId]);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      // Get active bookings
      const response = await fetch(
        `/api/bookings?hotelId=${hotelId}&status=CONFIRMED,CHECKED_IN&limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      // Get rooms
      const response = await fetch(
        `/api/rooms?hotelId=${hotelId}&status=available&limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data
      const data: any = {
        hotelId,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isActive,
      };

      if (username) data.username = username;
      if (password) data.password = password;
      if (bookingId) data.bookingId = bookingId;
      if (roomId) data.roomId = roomId;

      // Create credential
      const response = await fetch('/api/wifi/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create credential');
      }

      const credential = await response.json();
      
      toast.success('WiFi credential created successfully');
      
      // Reset form
      resetForm();
      
      // Notify parent
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credential');
      toast.error(err instanceof Error ? err.message : 'Failed to create credential');
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setUsername('');
    setPassword('');
    setValidFrom(new Date());
    setValidTo(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setIsActive(true);
    setBookingId(undefined);
    setRoomId(undefined);
    setError(null);
  };

  // Handle booking selection
  const handleBookingChange = (id: string) => {
    setBookingId(id);
    
    // Find booking
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      // Update date range to match booking
      setValidFrom(new Date(booking.checkInDate));
      setValidTo(new Date(booking.checkOutDate));
      
      // Clear room selection as it's linked to a booking now
      setRoomId(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate WiFi Credential</DialogTitle>
          <DialogDescription>
            Create a new WiFi credential for a guest or a specific room.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Booking selector */}
          <div className="space-y-2">
            <Label htmlFor="booking">For booking (optional)</Label>
            <Select value={bookingId} onValueChange={handleBookingChange}>
              <SelectTrigger id="booking" className="w-full">
                <SelectValue placeholder="Select a booking (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {loadingBookings ? (
                    <SelectItem value="loading" disabled>
                      Loading bookings...
                    </SelectItem>
                  ) : bookings.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No active bookings found
                    </SelectItem>
                  ) : (
                    bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.customer.user.name} ({format(new Date(booking.checkInDate), 'MMM dd')} - {format(new Date(booking.checkOutDate), 'MMM dd')})
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Room selector (only show if no booking selected) */}
          {!bookingId && (
            <div className="space-y-2">
              <Label htmlFor="room">For room (optional)</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger id="room" className="w-full">
                  <SelectValue placeholder="Select a room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {loadingRooms ? (
                      <SelectItem value="loading" disabled>
                        Loading rooms...
                      </SelectItem>
                    ) : rooms.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No rooms found
                      </SelectItem>
                    ) : (
                      rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} ({room.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              placeholder="Leave blank to auto-generate"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              If left blank, a username will be generated based on your WiFi settings.
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              type="text"
              placeholder="Leave blank to auto-generate"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              If left blank, a secure password will be generated automatically.
            </p>
          </div>

          {/* Valid date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid from</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validFrom ? format(validFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validFrom}
                    onSelect={(date) => date && setValidFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Valid to</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validTo ? format(validTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validTo}
                    onSelect={(date) => date && setValidTo(date)}
                    initialFocus
                    disabled={(date) => date < validFrom}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive">Activate immediately</Label>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Credential'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}