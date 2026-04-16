'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CreditCard, Users, Info, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Hotel {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  roomTypeName: string;
  roomTypeDescription?: string;
  pricePerNight: number;
  finalPrice?: number;
  maxGuests: number;
  totalUnits: number;
  availableUnits: number;
  amenities?: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
  }>;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone: string;
  address?: string;
}

interface WalkInBookingFormProps {
  hotels: Hotel[];
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  hotelId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  customerId: string; // Changed from individual guest fields
  isNewCustomer: boolean; // Flag to determine if creating new customer
  // New customer fields
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress: string;
  numberOfGuests: number;
  specialRequests: string;
  paymentMethod: string;
  amountPaid: number;
  idType: string;
  idNumber: string;
  documents: File[];
}

const formSteps = [
  'Hotel & Room Selection',
  'Dates & Guests',
  'Customer Information',
  'ID & Documents',
  'Payment Details',
  'Review & Confirm'
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function WalkInBookingForm({ hotels, vendorId, isOpen, onClose }: WalkInBookingFormProps) {
  const router = useRouter();
  const [[page, direction], setPage] = useState([0, 0]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const [formData, setFormData] = useState<FormData>({
    hotelId: '',
    roomId: '',
    checkInDate: format(new Date(), 'yyyy-MM-dd'),
    checkOutDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    customerId: '',
    isNewCustomer: true,
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    guestAddress: '',
    numberOfGuests: 1,
    specialRequests: '',
    paymentMethod: 'CASH',
    amountPaid: 0,
    idType: '',
    idNumber: '',
    documents: []
  });

  const paginate = (newDirection: number) => {
    if (page + newDirection >= 0 && page + newDirection < formSteps.length) {
      setPage([page + newDirection, newDirection]);
    }
  };

  const fetchCustomers = async (search?: string) => {
    setIsLoadingCustomers(true);
    try {
      const url = new URL('/api/vendor/customers', window.location.origin);
      if (search) {
        url.searchParams.set('search', search);
      }
      url.searchParams.set('limit', '50'); // Get more for selection
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      } else {
        console.error('Failed to fetch customers:', response.statusText);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchRooms = async (hotelId: string) => {
    if (!hotelId) return;
    
    setIsLoadingRooms(true);
    try {
      // Include check-in and check-out dates for availability checking
      const checkInDate = formData.checkInDate;
      const checkOutDate = formData.checkOutDate;
      
      const url = new URL(`/api/vendor/hotels/${hotelId}/available-rooms`, window.location.origin);
      if (checkInDate && checkOutDate) {
        url.searchParams.set('checkInDate', checkInDate);
        url.searchParams.set('checkOutDate', checkOutDate);
      }
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched rooms:', data); // Debug log
        
        // Filter rooms that have available units
        const availableRooms = data.filter((room: Room) => room.availableUnits > 0);
        setRooms(availableRooms);
        
        if (availableRooms.length > 0) {
          setFormData(prev => ({ ...prev, roomId: availableRooms[0].id }));
        } else {
          setFormData(prev => ({ ...prev, roomId: '' }));
        }
      } else {
        console.error('Failed to fetch rooms:', response.statusText);
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const selectedRoomObj = rooms.find(room => room.id === formData.roomId);
  const pricePerNight = selectedRoomObj ? (selectedRoomObj.finalPrice || selectedRoomObj.pricePerNight) : 0;
  
  const checkInDateObj = new Date(formData.checkInDate);
  const checkOutDateObj = new Date(formData.checkOutDate);
  const nights = Math.max(1, Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  
  const totalAmount = pricePerNight * nights;

  // Auto-fetch rooms when hotel is selected
  useEffect(() => {
    if (formData.hotelId) {
      fetchRooms(formData.hotelId);
    }
  }, [formData.hotelId]);

  // Auto-fetch customers when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  // Search customers when search term changes
  useEffect(() => {
    if (customerSearch) {
      const timeoutId = setTimeout(() => {
        fetchCustomers(customerSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      fetchCustomers();
    }
  }, [customerSearch]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      let finalCustomerId = formData.customerId;
      
      // If creating a new customer, create it first
      if (formData.isNewCustomer) {
        const customerResponse = await fetch('/api/vendor/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.guestFirstName,
            lastName: formData.guestLastName,
            email: formData.guestEmail,
            phone: formData.guestPhone,
            address: formData.guestAddress
          }),
        });
        
        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          throw new Error(errorData.error || 'Failed to create customer');
        }
        
        const customerData = await customerResponse.json();
        finalCustomerId = customerData.customer.id;
      }
      
      const bookingResponse = await fetch('/api/vendor/bookings/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId: formData.hotelId,
          roomId: formData.roomId,
          customerId: finalCustomerId,
          guestName: formData.isNewCustomer 
            ? `${formData.guestFirstName} ${formData.guestLastName}`.trim()
            : customers.find(c => c.id === formData.customerId)?.fullName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          numberOfGuests: formData.numberOfGuests,
          specialRequests: formData.specialRequests,
          paymentMethod: formData.paymentMethod,
          totalAmount,
          amountPaid: formData.amountPaid,
          idType: formData.idType,
          idNumber: formData.idNumber
        }),
      });
      
      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const bookingData = await bookingResponse.json();
      const bookingId = bookingData.bookingId || bookingData.id;

      if (formData.documents.length > 0) {
        for (const file of formData.documents) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          formDataUpload.append('name', file.name);

          const documentResponse = await fetch(`/api/bookings/${bookingId}/documents`, {
            method: 'POST',
            body: formDataUpload,
          });

          if (!documentResponse.ok) {
            console.error('Failed to upload document:', file.name);
          }
        }
      }
      
      setSuccessMessage('Walk-in booking created successfully!');
      
      setTimeout(() => {
        onClose();
        router.push('/vendor/dashboard');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error creating walk-in booking:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(event.target.files || [])]
      }));
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel*</Label>
              <Select
                value={formData.hotelId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, hotelId: value }));
                  fetchRooms(value);
                }}
              >
                <SelectTrigger className="w-full">
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
            </div>  
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="room">Room*</Label>
                {formData.hotelId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRooms(formData.hotelId)}
                    disabled={isLoadingRooms}
                    className="text-xs"
                  >
                    {isLoadingRooms ? 'Loading...' : 'Refresh'}
                  </Button>
                )}
              </div>
              <Select
                value={formData.roomId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}
                disabled={!formData.hotelId || isLoadingRooms}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    isLoadingRooms 
                      ? "Loading rooms..." 
                      : !formData.hotelId 
                        ? "Select a hotel first" 
                        : rooms.length === 0 
                          ? "No available rooms" 
                          : "Select a room"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {rooms.length === 0 && !isLoadingRooms && formData.hotelId && (
                    <div className="p-2 text-sm text-gray-500">
                      No rooms available for selected dates
                    </div>
                  )}
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex flex-col">
                        <div className="font-medium">
                          {room.name} ({room.roomTypeName})
                        </div>
                        <div className="text-sm text-gray-500">
                          {room.finalPrice && room.finalPrice !== room.pricePerNight ? (
                            <>
                              <span className="line-through">{room.pricePerNight.toFixed(2)}</span>
                              <span className="ml-1 text-green-600 font-medium">{room.finalPrice.toFixed(2)}</span>
                            </>
                          ) : (
                            <span>{room.pricePerNight.toFixed(2)}</span>
                          )} NGN/night • {room.availableUnits} available • Max {room.maxGuests} guests
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.hotelId && rooms.length === 0 && !isLoadingRooms && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    No rooms are available for the selected dates. Try different dates or check back later.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Check-in Date*</Label>
              <Input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, checkInDate: e.target.value }));
                  // Refetch rooms if hotel is selected
                  if (formData.hotelId) {
                    setTimeout(() => fetchRooms(formData.hotelId), 100);
                  }
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="checkOutDate">Check-out Date*</Label>
              <Input
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, checkOutDate: e.target.value }));
                  // Refetch rooms if hotel is selected
                  if (formData.hotelId) {
                    setTimeout(() => fetchRooms(formData.hotelId), 100);
                  }
                }}
                min={format(addDays(new Date(formData.checkInDate), 1), 'yyyy-MM-dd')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Number of Guests*</Label>
              <Input
                type="number"
                value={formData.numberOfGuests}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) }))}
                min={1}
                max={selectedRoomObj?.maxGuests || 1}
                required
              />
              {selectedRoomObj && (
                <p className="text-sm text-gray-500">
                  Maximum {selectedRoomObj.maxGuests} guests for this room
                </p>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="customerType"
                    checked={!formData.isNewCustomer}
                    onChange={() => setFormData(prev => ({ ...prev, isNewCustomer: false, customerId: '' }))}
                  />
                  <span>Select Existing Customer</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="customerType"
                    checked={formData.isNewCustomer}
                    onChange={() => setFormData(prev => ({ ...prev, isNewCustomer: true, customerId: '' }))}
                  />
                  <span>Add New Customer</span>
                </label>
              </div>

              {!formData.isNewCustomer ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerSearch">Search Customers</Label>
                    <Input
                      type="text"
                      placeholder="Search by name or phone number..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Select Customer*</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, customerId: value }));
                        const selectedCustomer = customers.find(c => c.id === value);
                        if (selectedCustomer) {
                          setFormData(prev => ({
                            ...prev,
                            guestFirstName: selectedCustomer.firstName,
                            guestLastName: selectedCustomer.lastName || '',
                            guestEmail: selectedCustomer.email || '',
                            guestPhone: selectedCustomer.phone,
                            guestAddress: selectedCustomer.address || ''
                          }));
                        }
                      }}
                      disabled={isLoadingCustomers}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          isLoadingCustomers 
                            ? "Loading customers..." 
                            : customers.length === 0 
                              ? "No customers found" 
                              : "Select a customer"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <div className="font-medium">{customer.fullName}</div>
                              <div className="text-sm text-gray-500">
                                {customer.phone} {customer.email && `• ${customer.email}`}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guestFirstName">First Name*</Label>
                      <Input
                        type="text"
                        value={formData.guestFirstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestFirstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestLastName">Last Name</Label>
                      <Input
                        type="text"
                        value={formData.guestLastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestLastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guestPhone">Phone*</Label>
                    <Input
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, guestPhone: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guestAddress">Address</Label>
                    <Textarea
                      value={formData.guestAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, guestAddress: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="idType">ID Type*</Label>
              <Select
                value={formData.idType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, idType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select ID Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                  <SelectItem value="DRIVERS_LICENSE">Driver&apos;s License</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="VOTERS_CARD">Voter&apos;s Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number*</Label>
              <Input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documents">Upload Documents</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  id="documents"
                />
                <Label
                  htmlFor="documents"
                  className="cursor-pointer flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>Choose files</span>
                </Label>
              </div>
              {formData.documents.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected files:</p>
                  <ul className="list-disc list-inside">
                    {formData.documents.map((file, index) => (
                      <li key={index} className="text-sm">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method*</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid*</Label>
              <Input
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) }))}
                min={0}
                max={totalAmount}
                required
              />
              <p className="text-sm text-gray-600">Total amount: {totalAmount.toFixed(2)} NGN</p>
            </div>
          </div>
        );
      
      case 5:
        const selectedCustomer = customers.find(c => c.id === formData.customerId);
        const customerName = formData.isNewCustomer 
          ? `${formData.guestFirstName} ${formData.guestLastName}`.trim()
          : selectedCustomer?.fullName || '';
        
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-4">Booking Summary</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Hotel:</dt>
                  <dd className="font-medium">{hotels.find(h => h.id === formData.hotelId)?.name}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Room:</dt>
                  <dd className="font-medium">{rooms.find(r => r.id === formData.roomId)?.name}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Check-in:</dt>
                  <dd className="font-medium">{format(new Date(formData.checkInDate), 'PP')}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Check-out:</dt>
                  <dd className="font-medium">{format(new Date(formData.checkOutDate), 'PP')}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Guests:</dt>
                  <dd className="font-medium">{formData.numberOfGuests}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Customer:</dt>
                  <dd className="font-medium">{customerName} {formData.isNewCustomer && '(New)'}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Phone:</dt>
                  <dd className="font-medium">{formData.guestPhone}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Payment Method:</dt>
                  <dd className="font-medium">{formData.paymentMethod}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Total Amount:</dt>
                  <dd className="font-medium">{totalAmount.toFixed(2)} NGN</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Amount Paid:</dt>
                  <dd className="font-medium">{formData.amountPaid.toFixed(2)} NGN</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-gray-600">Balance:</dt>
                  <dd className="font-medium">{(totalAmount - formData.amountPaid).toFixed(2)} NGN</dd>
                </div>
              </dl>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Walk-in Booking</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Step {page + 1} of {formSteps.length}
              </div>
            </div>
            
            <div className="relative pt-4">
              <div className="overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${((page + 1) / formSteps.length) * 100}%` }}
                />
              </div>
              
              <div className="mt-2 grid grid-cols-6 text-xs">
                {formSteps.map((step, index) => (
                  <div
                    key={step}
                    className={cn(
                      "text-center",
                      index <= page ? "text-blue-600" : "text-gray-400"
                    )}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-[400px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute w-full"
              >
                {renderStepContent(page)}
              </motion.div>
            </AnimatePresence>
          </div>

          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              onClick={() => paginate(-1)}
              disabled={page === 0 || isSubmitting}
              variant="outline"
            >
              Previous
            </Button>

            {page === formSteps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 text-white"
              >
                {isSubmitting ? 'Creating Booking...' : 'Complete Booking'}
              </Button>
            ) : (
              <Button
                onClick={() => paginate(1)}
                disabled={isSubmitting}
                variant="outline"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 