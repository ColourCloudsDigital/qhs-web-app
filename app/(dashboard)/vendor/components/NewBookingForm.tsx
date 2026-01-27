'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CreditCard, Info, Loader2 } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Hotel {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  totalBookings?: number;
  totalSpent?: number;
  lastBooking?: string;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
  displayName: string;
}

interface RoomUnit {
  unitId: string;
  roomNumber: string;
  unitStatus: string;
  notes: string | null;
  lastCleanedAt: string | null;
  roomId: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  discountedPrice: number | null;
  finalPrice: number;
  maxGuests: number;
  roomDescription: string | null;
  roomImages: string | null;
  roomStatus: string;
  displayName: string;
  statusDisplay: string;
}

interface NewBookingFormProps {
  hotels: Hotel[];
  vendorId: string;
}

export default function NewBookingForm({ hotels, vendorId }: NewBookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Debug: Log the hotels prop
  console.log('NewBookingForm received hotels:', hotels);
  console.log('NewBookingForm received vendorId:', vendorId);
  
  // Room units data
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  
  // Customer search data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  
  // Form state
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedRoomUnit, setSelectedRoomUnit] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [guestFirstName, setGuestFirstName] = useState<string>('');
  const [guestLastName, setGuestLastName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestNationality, setGuestNationality] = useState<string>('');
  const [guestIdType, setGuestIdType] = useState<string>('');
  const [guestIdNumber, setGuestIdNumber] = useState<string>('');
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
  // Get room units when hotel changes
  useEffect(() => {
    if (!selectedHotel) return;
    
    setSelectedRoomUnit('');
    setRoomUnits([]);
    
    async function fetchRoomUnits() {
      try {
        setLoading(true);
        console.log('Fetching room units for hotel:', selectedHotel);
        const response = await fetch(`/api/vendor/hotels/${selectedHotel}/room-units`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Room units API response:', data);
          
          // Process room units data to match expected format
          const processedData = data.map((unit: any) => ({
            unitId: unit.id,
            roomNumber: unit.roomNumber,
            unitStatus: unit.status,
            notes: unit.notes,
            lastCleanedAt: unit.lastCleanedAt,
            roomId: unit.roomId,
            roomName: unit.roomName,
            roomType: unit.roomType,
            pricePerNight: typeof unit.pricePerNight === 'number' ? unit.pricePerNight : parseFloat(unit.pricePerNight) || 0,
            discountedPrice: unit.discountedPrice ? (typeof unit.discountedPrice === 'number' ? unit.discountedPrice : parseFloat(unit.discountedPrice)) : null,
            finalPrice: typeof unit.finalPrice === 'number' ? unit.finalPrice : parseFloat(unit.finalPrice) || 0,
            maxGuests: typeof unit.maxGuests === 'number' ? unit.maxGuests : parseInt(unit.maxGuests) || 1,
            roomDescription: unit.roomDescription,
            roomImages: unit.roomImages,
            roomStatus: unit.roomStatus,
            displayName: `${unit.roomName} - ${unit.roomNumber}`,
            statusDisplay: unit.status === 'available' ? 'Available' : 
                         unit.status === 'occupied' ? 'Occupied' :
                         unit.status === 'maintenance' ? 'Maintenance' :
                         unit.status === 'cleaning' ? 'Cleaning' : 'Reserved'
          }));
          
          console.log('Processed room units:', processedData);
          setRoomUnits(processedData);
          
          // Set default room unit if available
          if (processedData.length > 0) {
            setSelectedRoomUnit(processedData[0].unitId);
          }
        } else {
          const errorData = await response.json();
          console.error('Failed to load room units:', response.status, errorData);
          setErrorMessage(`Failed to load room units: ${errorData.error || 'Unknown error'}`);
          setRoomUnits([]);
        }
      } catch (error) {
        console.error('Error fetching room units:', error);
        setErrorMessage('Error fetching room units. Please try again.');
        setRoomUnits([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRoomUnits();
  }, [selectedHotel]);

  // Customer search functionality
  const searchCustomers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      return;
    }

    setIsLoadingCustomers(true);
    try {
      const response = await fetch(`/api/vendor/customers?search=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        // The API should return { customers: [...], pagination: {...}, stats: {...} }
        setCustomers(data.customers || []);
      } else {
        console.error('Failed to search customers');
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Debounced customer search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch && !isNewCustomer) {
        searchCustomers(customerSearch);
      } else {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch, isNewCustomer]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customerId);
      setGuestFirstName(customer.firstName);
      setGuestLastName(customer.lastName);
      setGuestPhone(customer.phone);
      setGuestEmail(customer.email || '');
      setGuestNationality(customer.nationality || '');
      setGuestIdType(customer.idType || '');
      setGuestIdNumber(customer.idNumber || '');
    }
  };
  
  // Calculate total amount
  const selectedRoomUnitObj = roomUnits.find(unit => unit.unitId === selectedRoomUnit);
  const pricePerNight = selectedRoomUnitObj ? selectedRoomUnitObj.finalPrice : 0;
  
  // Calculate number of nights
  const checkInDateObj = new Date(checkInDate);
  const checkOutDateObj = new Date(checkOutDate);
  const nights = Math.max(1, Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  
  const totalAmount = pricePerNight * nights;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHotel || !selectedRoomUnit || !checkInDate || !checkOutDate || !guestFirstName || !guestPhone) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Create walk-in booking for vendor
      const bookingResponse = await fetch('/api/vendor/bookings/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId: selectedHotel,
          roomUnitId: selectedRoomUnit, // Send room unit ID directly
          guestFirstName,
          guestLastName,
          guestPhone,
          guestEmail,
          guestNationality,
          guestIdType,
          guestIdNumber,
          checkInDate,
          checkOutDate,
          numberOfGuests: parseInt(numberOfGuests.toString()),
          specialRequests,
          paymentMethod,
          totalAmount,
          depositAmount: parseFloat(amountPaid.toString()) || 0,
          customerId: !isNewCustomer && selectedCustomer ? selectedCustomer : null,
        }),
      });
      
      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      setSuccessMessage('Booking created successfully!');
      
      // Reset form
      setSelectedHotel('');
      setSelectedRoomUnit('');
      setCheckInDate(format(new Date(), 'yyyy-MM-dd'));
      setCheckOutDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
      setGuestFirstName('');
      setGuestLastName('');
      setGuestPhone('');
      setGuestEmail('');
      setGuestNationality('');
      setGuestIdType('');
      setGuestIdNumber('');
      setNumberOfGuests(1);
      setSpecialRequests('');
      setPaymentMethod('CASH');
      setAmountPaid(0);
      setCustomerSearch('');
      setSelectedCustomer('');
      setIsNewCustomer(true);
      setCustomers([]);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/vendor/bookings');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrorMessage('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading booking form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Booking</CardTitle>
        <CardDescription>
          Create a new walk-in booking for your hotel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success Messages */}
          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Hotel Selection */}
            <div>
              <Label htmlFor="hotel">Hotel*</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Debug info */}
              <div className="mt-1 text-xs text-gray-500">
                Available hotels: {hotels.length}
                {hotels.length > 0 && ` | First hotel: ${hotels[0].name}`}
              </div>
            </div>

            {/* Room Unit Selection */}
            <div>
              <Label htmlFor="roomUnit">Room Unit*</Label>
              <Select value={selectedRoomUnit} onValueChange={setSelectedRoomUnit} required disabled={!selectedHotel || roomUnits.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedHotel ? "Select a hotel first" : 
                    roomUnits.length === 0 ? "No room units available" : 
                    "Select a room unit"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {roomUnits.map((unit) => (
                    <SelectItem key={unit.unitId} value={unit.unitId}>
                      <div className="flex flex-col">
                        <div className="font-medium">
                          {unit.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Status: {unit.statusDisplay} • {unit.discountedPrice ? (
                            <>
                              <span className="line-through">{(unit.pricePerNight || 0).toFixed(2)}</span>
                              <span className="ml-1 text-green-600">{(unit.discountedPrice || 0).toFixed(2)}</span>
                            </>
                          ) : (
                            (unit.pricePerNight || 0).toFixed(2)
                          )} NGN/night
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Debug info */}
              {selectedHotel && (
                <div className="mt-1 text-xs text-gray-500">
                  Hotel: {selectedHotel} | Room units: {roomUnits.length} | Loading: {loading.toString()}
                </div>
              )}
              {selectedRoomUnitObj && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${
                      selectedRoomUnitObj.unitStatus === 'available' ? 'text-green-600' :
                      selectedRoomUnitObj.unitStatus === 'occupied' ? 'text-red-600' :
                      selectedRoomUnitObj.unitStatus === 'maintenance' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {selectedRoomUnitObj.statusDisplay}
                    </span>
                  </p>
                  {selectedRoomUnitObj.notes && (
                    <p className="text-sm text-gray-500">
                      Note: {selectedRoomUnitObj.notes}
                    </p>
                  )}
                  {selectedRoomUnitObj.lastCleanedAt && (
                    <p className="text-sm text-gray-500">
                      Last cleaned: {new Date(selectedRoomUnitObj.lastCleanedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Number of Guests */}
            <div>
              <Label htmlFor="numberOfGuests">Number of Guests*</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  id="numberOfGuests"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                  min="1"
                  max={selectedRoomUnitObj?.maxGuests || 4}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {/* Check-in Date */}
            <div>
              <Label htmlFor="checkInDate">Check-in Date*</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  id="checkInDate"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {/* Check-out Date */}
            <div>
              <Label htmlFor="checkOutDate">Check-out Date*</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  id="checkOutDate"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {/* Customer Search Section */}
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="customerType"
                      checked={!isNewCustomer}
                      onChange={() => {
                        setIsNewCustomer(false);
                        setGuestFirstName('');
                        setGuestLastName('');
                        setGuestPhone('');
                        setSelectedCustomer('');
                      }}
                    />
                    <span>Search Existing Customer</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="customerType"
                      checked={isNewCustomer}
                      onChange={() => {
                        setIsNewCustomer(true);
                        setCustomerSearch('');
                        setCustomers([]);
                        setSelectedCustomer('');
                        setGuestFirstName('');
                        setGuestLastName('');
                        setGuestPhone('');
                        setGuestEmail('');
                        setGuestNationality('');
                        setGuestIdType('');
                        setGuestIdNumber('');
                      }}
                    />
                    <span>New Customer</span>
                  </label>
                </div>

                {!isNewCustomer && (
                  <div className="space-y-2">
                    <Label htmlFor="customerSearch">Search Customer</Label>
                    <Input
                      type="text"
                      id="customerSearch"
                      placeholder="Search by name or phone number..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    
                    {isLoadingCustomers && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Searching customers...</span>
                      </div>
                    )}
                    
                    {customers.length > 0 && (
                      <div className="space-y-2">
                        <Label>Select Customer</Label>
                        <Select value={selectedCustomer} onValueChange={handleCustomerSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {customerSearch && !isLoadingCustomers && customers.length === 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          No customers found. You can create a new customer by selecting "New Customer" above.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Guest First Name */}
            <div>
              <Label htmlFor="guestFirstName">Guest First Name*</Label>
              <Input
                type="text"
                id="guestFirstName"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                disabled={!isNewCustomer && !selectedCustomer}
                required
              />
            </div>
            
            {/* Guest Last Name */}
            <div>
              <Label htmlFor="guestLastName">Guest Last Name</Label>
              <Input
                type="text"
                id="guestLastName"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                disabled={!isNewCustomer && !selectedCustomer}
              />
            </div>
            
            {/* Guest Phone */}
            <div>
              <Label htmlFor="guestPhone">Guest Phone*</Label>
              <Input
                type="tel"
                id="guestPhone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                disabled={!isNewCustomer && !selectedCustomer}
                required
              />
            </div>
            
            {/* Guest Email */}
            <div>
              <Label htmlFor="guestEmail">Guest Email</Label>
              <Input
                type="email"
                id="guestEmail"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                disabled={!isNewCustomer && !selectedCustomer}
              />
            </div>
            
            {/* Guest Nationality */}
            <div>
              <Label htmlFor="guestNationality">Nationality</Label>
              <Input
                type="text"
                id="guestNationality"
                value={guestNationality}
                onChange={(e) => setGuestNationality(e.target.value)}
                disabled={!isNewCustomer && !selectedCustomer}
              />
            </div>
            
            {/* Guest ID Type */}
            <div>
              <Label htmlFor="guestIdType">ID Type</Label>
              <Select 
                value={guestIdType} 
                onValueChange={setGuestIdType}
                disabled={!isNewCustomer && !selectedCustomer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="voters_card">Voter's Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Guest ID Number */}
            <div>
              <Label htmlFor="guestIdNumber">ID Number</Label>
              <Input
                type="text"
                id="guestIdNumber"
                value={guestIdNumber}
                onChange={(e) => setGuestIdNumber(e.target.value)}
                disabled={!isNewCustomer && !selectedCustomer}
              />
            </div>
            
            {/* Payment Method */}
            <div>
              <Label htmlFor="paymentMethod">Payment Method*</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Amount Paid */}
            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  id="amountPaid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  min="0"
                  max={totalAmount}
                  step="0.01"
                  className="pl-10"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Total amount: {totalAmount.toFixed(2)} NGN ({nights} night{nights > 1 ? 's' : ''})
              </p>
            </div>
            
            {/* Special Requests - Full width */}
            <div className="md:col-span-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/vendor/bookings')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 