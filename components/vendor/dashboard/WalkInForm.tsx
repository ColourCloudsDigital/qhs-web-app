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
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import toast from '@/lib/toast';
import { Calendar as CalendarIcon, CheckCircle, Loader2, User, Hotel, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn, formatCurrency } from '@/lib/utils';
import { CustomSelect } from './CustomSelect';

interface Room {
  id: string;
  name: string;
  type: string;
  roomNumber: string;
  capacity: number;
  price?: number;
  pricePerNight?: number;
  discountedPrice?: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning';
}

interface WalkInFormProps {
  hotelId: string;
  onSuccess?: () => void;
}

export default function WalkInForm({ hotelId, onSuccess }: WalkInFormProps) {
  // Multi-step form
  const [step, setStep] = useState(1);
  
  // Step 1: Guest Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  
  // ID verification
  const [idType, setIdType] = useState('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  
  // Step 2: Room Selection
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [roomId, setRoomId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [nights, setNights] = useState(1);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  
  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [issueKeycard, setIssueKeycard] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate nights and total amount when dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const nightsCount = Math.max(
        1, 
        Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      setNights(nightsCount);
      
      // Update total amount if a room is selected
      if (selectedRoom) {
        // Try all possible price fields and provide a fallback
        const roomPrice = 
          typeof selectedRoom.pricePerNight === 'number' ? selectedRoom.pricePerNight :
          typeof selectedRoom.price === 'number' ? selectedRoom.price :
          Number(selectedRoom.pricePerNight || selectedRoom.price) || 25000;
          
        setTotalAmount(roomPrice * nightsCount);
        setAmountPaid(roomPrice * nightsCount);
      }
    }
  }, [checkInDate, checkOutDate, selectedRoom]);
  
  // Fetch available rooms when dates change
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!checkInDate || !checkOutDate) return;
      
      try {
        setRoomsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/vendor/hotels/${hotelId}/rooms/status`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch available rooms');
        }
        
        const data = await response.json();
        
        // Filter rooms that are available and meet capacity requirements
        const availableRoomsList = data.rooms
          .filter((room: any) => 
            room.status === 'available' && 
            room.capacity >= numberOfGuests
          )
          .map((room: any) => ({
            id: room.id,
            name: room.type,
            type: room.type,
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            price: Number(room.price) || 25000, // Ensure price is a number with fallback
            status: room.status
          }));
        
        setAvailableRooms(availableRoomsList);
        
        // Clear selected room if it's no longer available
        if (selectedRoom && !availableRoomsList.find((r: Room) => r.id === selectedRoom.id)) {
          setSelectedRoom(null);
          setRoomId('');
        }
      } catch (err) {
        console.error('Error fetching available rooms:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setRoomsLoading(false);
      }
    };
    
    if (step === 2) {
      fetchAvailableRooms();
    }
  }, [hotelId, checkInDate, checkOutDate, numberOfGuests, step, selectedRoom?.id]);
  
  // Handle room selection
  const handleRoomSelect = (newRoomId: string) => {
    setRoomId(newRoomId);
    
    const room = availableRooms.find(r => r.id === newRoomId) || null;
    setSelectedRoom(room);
    
    if (room) {
      // Ensure the price is a number
      // Try all possible price fields and provide a fallback
      const roomPrice = 
        typeof room.pricePerNight === 'number' ? room.pricePerNight :
        typeof room.price === 'number' ? room.price :
        Number(room.pricePerNight || room.price) || 25000; // Fallback to 25000 if conversion fails
      
      setTotalAmount(roomPrice * nights);
      setAmountPaid(roomPrice * nights);
    } else {
      setTotalAmount(0);
      setAmountPaid(0);
    }
  };
  
  // Verify ID
  const handleVerifyId = () => {
    if (!idNumber || idNumber.length < 5) {
      toast.error("Please enter a valid ID number", {
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
  
  // Handle form navigation
  const nextStep = () => {
    if (step === 1) {
      // Validate guest info
      if (!firstName || !lastName) {
        toast.error("Please enter guest name", {
          title: "Missing guest information"
        });
        return;
      }
      
      if (!idVerified) {
        toast.error("Please verify the guest&apos;s ID before proceeding", {
          title: "ID verification required"
        });
        return;
      }
    }
    
    if (step === 2) {
      // Validate room selection
      if (!roomId || !selectedRoom) {
        toast.error("Please select a room for the booking", {
          title: "No room selected"
        });
        return;
      }
    }
    
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate payment
    if (amountPaid < 0 || amountPaid > totalAmount) {
      toast.error("Please enter a valid payment amount", {
        title: "Invalid payment amount"
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/vendor/bookings/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId,
          roomId: selectedRoom?.id,
          guest: {
            firstName,
            lastName,
            email,
            phone,
            address,
            createAccount,
            idType,
            idNumber
          },
          booking: {
            checkInDate,
            checkOutDate,
            numberOfGuests,
            specialRequests,
            totalAmount,
            issueKeycard
          },
          payment: {
            paymentMethod,
            amountPaid: Number(amountPaid)
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const data = await response.json();
      
      toast.success(`Check-in completed successfully. Booking ID: ${data.bookingId}`, {
        title: "Guest checked in"
      });
      
      // Reset form
      setStep(1);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setRoomId('');
      setSelectedRoom(null);
      setCheckInDate(new Date());
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckOutDate(tomorrow);
      setNumberOfGuests(1);
      setIdType('NIN');
      setIdNumber('');
      setIdVerified(false);
      setPaymentMethod('CASH');
      setAmountPaid(0);
      setCreateAccount(false);
      setIssueKeycard(true);
      setSpecialRequests('');
      
      // Notify parent if needed
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(err instanceof Error ? err.message : "Failed to check in the guest", {
        title: "Check-in failed"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Step indicators
  const StepIndicator = () => (
    <div className="mb-6 flex justify-between">
      <div 
        className={cn(
          "flex flex-col items-center",
          step >= 1 ? "text-primary" : "text-gray-400"
        )}
      >
        <div className={cn(
          "mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2",
          step >= 1 ? "border-primary bg-primary/10" : "border-gray-200"
        )}>
          <User className="h-5 w-5" />
        </div>
        <span className="text-xs">Guest Info</span>
      </div>
      
      <div className="relative flex-1 mx-4">
        <div className={cn(
          "absolute top-5 w-full border-t",
          step >= 2 ? "border-primary" : "border-gray-200"
        )} />
      </div>
      
      <div 
        className={cn(
          "flex flex-col items-center",
          step >= 2 ? "text-primary" : "text-gray-400"
        )}
      >
        <div className={cn(
          "mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2",
          step >= 2 ? "border-primary bg-primary/10" : "border-gray-200"
        )}>
          <Hotel className="h-5 w-5" />
        </div>
        <span className="text-xs">Room</span>
      </div>
      
      <div className="relative flex-1 mx-4">
        <div className={cn(
          "absolute top-5 w-full border-t",
          step >= 3 ? "border-primary" : "border-gray-200"
        )} />
      </div>
      
      <div 
        className={cn(
          "flex flex-col items-center",
          step >= 3 ? "text-primary" : "text-gray-400"
        )}
      >
        <div className={cn(
          "mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2",
          step >= 3 ? "border-primary bg-primary/10" : "border-gray-200"
        )}>
          <CreditCard className="h-5 w-5" />
        </div>
        <span className="text-xs">Payment</span>
      </div>
    </div>
  );
  
  return (
    <div className="py-4">
      {/* Step indicator */}
      <StepIndicator />
      
      {/* Step 1: Guest Information */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name <span className="text-red-500">*</span></Label>
              <Input 
                id="first-name" 
                placeholder="Enter first name" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name <span className="text-red-500">*</span></Label>
              <Input 
                id="last-name" 
                placeholder="Enter last name" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                placeholder="Enter phone number" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              placeholder="Enter address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id-type">ID Type <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="id-number">ID Number <span className="text-red-500">*</span></Label>
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
                  {idVerified ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
                  {idVerified ? "Verified" : "Verify"}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-3">
            <Checkbox 
              id="create-account" 
              checked={createAccount} 
              onCheckedChange={(checked) => setCreateAccount(checked as boolean)} 
            />
            <Label htmlFor="create-account" className="text-sm font-normal">Create account for future bookings</Label>
          </div>
        </div>
      )}
      
      {/* Step 2: Room Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check-in">Check-in Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="check-in"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkInDate ? format(checkInDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={(date) => date && setCheckInDate(date)}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="check-out">Check-out Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="check-out"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOutDate ? format(checkOutDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOutDate}
                    onSelect={(date) => date && setCheckOutDate(date)}
                    initialFocus
                    disabled={(date) => date <= checkInDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests <span className="text-red-500">*</span></Label>
              <Select 
                value={numberOfGuests.toString()} 
                onValueChange={(value) => setNumberOfGuests(parseInt(value))}
              >
                <SelectTrigger id="guests">
                  <SelectValue placeholder="Number of guests" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nights">Length of Stay</Label>
              <div className="border border-gray-200 p-3 rounded-md bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room">Select Room <span className="text-red-500">*</span></Label>
            {roomsLoading ? (
              <div className="flex h-10 items-center space-x-2 rounded border border-gray-300 px-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading rooms...</span>
              </div>
            ) : (
              <CustomSelect
                id="room"
                value={roomId}
                onChange={handleRoomSelect}
                options={availableRooms.map(room => ({
                  value: room.id,
                  label: `Room ${room.roomNumber} - ${room.type} (${formatCurrency(room.price)})`
                }))}
                placeholder="Select a room"
                loading={roomsLoading}
              />
            )}
          </div>
          
          {selectedRoom && (
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Room Type</p>
                  <p className="text-base font-semibold">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Room Number</p>
                  <p className="text-base font-semibold">{selectedRoom.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price per Night</p>
                                     <p className="text-base font-semibold">
                     {formatCurrency(
                       (typeof selectedRoom.pricePerNight === 'number' ? selectedRoom.pricePerNight :
                       typeof selectedRoom.price === 'number' ? selectedRoom.price :
                       Number(selectedRoom.pricePerNight || selectedRoom.price) || 25000) as number
                     )}
                   </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total for Stay</p>
                  <p className="text-base font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="special-requests">Special Requests</Label>
            <Textarea
              id="special-requests"
              placeholder="Add any special requirements or notes..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Booking summary */}
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Booking Summary</h3>
            
            <div className="grid gap-2">
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Guest</p>
                <p className="text-sm font-medium">{firstName} {lastName}</p>
              </div>
              
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Room</p>
                <p className="text-sm font-medium">{selectedRoom?.roomNumber} - {selectedRoom?.type}</p>
              </div>
              
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                <p className="text-sm font-medium">{format(checkInDate, 'PPP')}</p>
              </div>
              
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                <p className="text-sm font-medium">{format(checkOutDate, 'PPP')}</p>
              </div>
              
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Length of Stay</p>
                <p className="text-sm font-medium">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
              </div>
              
              <div className="grid grid-cols-2 border-t pt-2 mt-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-sm font-semibold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method <span className="text-red-500">*</span></Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount-paid">Amount Paid</Label>
            <Input
              id="amount-paid"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              min={0}
              max={totalAmount}
            />
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-500">Total: {formatCurrency(totalAmount)}</span>
              <span className={cn(
                "text-gray-500",
                totalAmount - amountPaid > 0 ? "text-amber-600 dark:text-amber-400" : ""
              )}>
                Balance: {formatCurrency(totalAmount - amountPaid)}
              </span>
            </div>
          </div>
          
          <div className="space-y-3 pt-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="issue-keycard" 
                checked={issueKeycard} 
                onCheckedChange={(checked) => setIssueKeycard(checked as boolean)} 
              />
              <Label htmlFor="issue-keycard" className="text-sm font-normal">Issue keycard automatically</Label>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="warning" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <DialogFooter className="mt-6 flex justify-between">
        {step > 1 ? (
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={onSuccess}
          >
            Cancel
          </Button>
        )}
        
        {step < 3 ? (
          <Button onClick={nextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Booking'
            )}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}