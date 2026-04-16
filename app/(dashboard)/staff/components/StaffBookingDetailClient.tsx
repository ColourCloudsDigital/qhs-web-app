'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Edit,
  Ban
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface BookingDetail {
  id: string;
  hotel: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    name: string;
    type: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests: string;
  createdAt: string;
  updatedAt: string;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    transactionId: string;
    createdAt: string;
  }>;
}

interface StaffBookingDetailClientProps {
  bookingId: string;
  staffId: string;
}

export default function StaffBookingDetailClient({ bookingId, staffId }: StaffBookingDetailClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Update form state
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>('');
  const [newSpecialRequests, setNewSpecialRequests] = useState<string>('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [requestingCancellation, setRequestingCancellation] = useState(false);

  // Fetch booking details
  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/staff/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      
      const data = await response.json();
      setBooking(data);
      setNewStatus(data.status);
      setNewPaymentStatus(data.paymentStatus);
      setNewSpecialRequests(data.specialRequests || '');
      
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Handle check-in
  const handleCheckIn = async () => {
    if (!booking) return;
    
    setCheckingIn(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      const response = await fetch(`/api/staff/bookings/${bookingId}/checkin`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check in guest');
      }
      
      setUpdateSuccess('Guest checked in successfully!');
      await fetchBooking(); // Refresh booking data
      
    } catch (err) {
      console.error('Error checking in guest:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to check in guest');
    } finally {
      setCheckingIn(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!booking) return;
    
    setCheckingOut(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      const response = await fetch(`/api/staff/bookings/${bookingId}/checkout`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check out guest');
      }
      
      setUpdateSuccess('Guest checked out successfully!');
      await fetchBooking(); // Refresh booking data
      
    } catch (err) {
      console.error('Error checking out guest:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to check out guest');
    } finally {
      setCheckingOut(false);
    }
  };
  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!booking) return;
    
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      const response = await fetch(`/api/staff/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          specialRequests: newSpecialRequests,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }
      
      setUpdateSuccess('Booking updated successfully!');
      
      // Refresh booking data
      await fetchBooking();
      
    } catch (err) {
      console.error('Error updating booking:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      CHECKED_OUT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      CANCELLATION_REQUESTED: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const handleRequestCancellation = async () => {
    if (!cancelReason.trim()) return;
    setRequestingCancellation(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/request-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to request cancellation');
      }
      setCancelModalOpen(false);
      setCancelReason('');
      setUpdateSuccess('Cancellation request submitted. Awaiting vendor approval.');
      await fetchBooking();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to request cancellation');
    } finally {
      setRequestingCancellation(false);
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const variants = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-orange-100 text-orange-800',
      PAID: 'bg-green-100 text-green-800',
      REFUNDED: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={variants[paymentStatus as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {paymentStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading booking information...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading booking details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
              <p className="text-gray-600 dark:text-gray-400">Error loading booking</p>
            </div>
            <Link href="/staff/bookings">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bookings
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Booking</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchBooking} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booking #{booking.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {booking.customer?.name || 'Guest'} • {booking.hotel?.name || 'Hotel'}
            </p>
          </div>
          <Link href="/staff/bookings">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Booking Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Check-in</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.checkInDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Check-out</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.checkOutDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Guests</p>
                        <p className="text-sm text-gray-600">{booking.numberOfGuests}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Room</p>
                        <p className="text-sm text-gray-600">{booking.room?.name || 'Room'} ({booking.room?.type || 'Standard'})</p>
                      </div>
                    </div>
                  </div>
                  
                  {booking.specialRequests && (
                    <div>
                      <p className="text-sm font-medium mb-2">Special Requests</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {booking.specialRequests}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {booking.customer?.name?.charAt(0)?.toUpperCase() || 'G'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{booking.customer?.name || 'Guest'}</p>
                        <p className="text-sm text-gray-600">Customer</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{booking.customer?.email || 'No email provided'}</p>
                      </div>
                    </div>
                    {booking.customer?.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-gray-600">{booking.customer.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Booked</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.payments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments</h3>
                      <p className="text-gray-500">No payments have been recorded for this booking.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {booking.payments.map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-600">
                                {payment.paymentMethod} • {formatDate(payment.createdAt)}
                              </p>
                              {payment.transactionId && (
                                <p className="text-xs text-gray-500">
                                  Transaction: {payment.transactionId}
                                </p>
                              )}
                            </div>
                            <Badge className={
                              payment.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Perform common booking actions quickly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {booking.status === 'CANCELLATION_REQUESTED' ? (
                    <div className="rounded-md bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700">
                      ⏳ Cancellation request is pending vendor approval. No actions available until resolved.
                    </div>
                  ) : (
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      const today = new Date(); today.setHours(0,0,0,0);
                      const checkIn = new Date(booking.checkInDate); checkIn.setHours(0,0,0,0);
                      const checkOut = new Date(booking.checkOutDate); checkOut.setHours(0,0,0,0);
                      const canCheckIn = today >= checkIn;
                      const isNoShow = today > checkOut;

                      return (
                        <>
                          {booking.status === 'CONFIRMED' && canCheckIn && (
                            <Button onClick={handleCheckIn} disabled={checkingIn} className="bg-green-600 hover:bg-green-700">
                              {checkingIn ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking In...</> : <><CheckCircle className="h-4 w-4 mr-2" />Check In Guest</>}
                            </Button>
                          )}
                          {booking.status === 'CONFIRMED' && !canCheckIn && (
                            <p className="text-sm text-gray-500">Check-in available from {new Date(booking.checkInDate).toLocaleDateString()}</p>
                          )}
                          {booking.status === 'CHECKED_IN' && (
                            <Button onClick={handleCheckOut} disabled={checkingOut} className="bg-blue-600 hover:bg-blue-700">
                              {checkingOut ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking Out...</> : <><XCircle className="h-4 w-4 mr-2" />Check Out Guest</>}
                            </Button>
                          )}
                          {booking.status === 'CONFIRMED' && isNoShow && (
                            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={async () => {
                              await fetch(`/api/staff/bookings/${bookingId}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'NO_SHOW' }) });
                              await fetchBooking();
                            }}>
                              <AlertCircle className="h-4 w-4 mr-2" />Mark as No-Show
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Update Booking</CardTitle>
                  <CardDescription>
                    Update the booking status, payment status, or special requests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {booking.status === 'CANCELLATION_REQUESTED' ? (
                    <div className="rounded-md bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700">
                      ⏳ Updates are locked while a cancellation request is pending vendor approval.
                    </div>
                  ) : (
                  <form onSubmit={handleUpdateBooking} className="space-y-4">
                    {updateError && (
                      <div className="rounded-md bg-red-50 p-4 text-red-700">
                        <p>{updateError}</p>
                      </div>
                    )}
                    
                    {updateSuccess && (
                      <div className="rounded-md bg-green-50 p-4 text-green-700">
                        <p>{updateSuccess}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Booking Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                            <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="paymentStatus">Payment Status</Label>
                        <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PARTIAL">Partial</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="REFUNDED">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        value={newSpecialRequests}
                        onChange={(e) => setNewSpecialRequests(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button type="submit" disabled={updating}>
                      {updating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>
                      ) : (
                        <><Edit className="h-4 w-4 mr-2" />Update Booking</>
                      )}
                    </Button>

                    {/* Request Cancellation — only for cancellable statuses */}
                    {booking && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setCancelModalOpen(true)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Request Cancellation
                      </Button>
                    )}

                    {booking?.status === 'CANCELLATION_REQUESTED' && (
                      <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
                        ⏳ Cancellation request pending vendor approval
                      </div>
                    )}
                  </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Booking Status</p>
                {getStatusBadge(booking.status)}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Payment Status</p>
                {getPaymentStatusBadge(booking.paymentStatus)}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Amount:</span>
                <span className="text-sm font-medium">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Paid Amount:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(booking.payments.reduce((sum, p) => sum + (p.status === 'COMPLETED' ? p.amount : 0), 0))}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Balance:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(booking.totalAmount - booking.payments.reduce((sum, p) => sum + (p.status === 'COMPLETED' ? p.amount : 0), 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Cancellation Request Modal */}
    {cancelModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">Request Cancellation</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            This will send a cancellation request to the vendor for approval. The booking will remain active until approved.
          </p>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason for cancellation *
          </label>
          <Textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Explain why this booking should be cancelled..."
            rows={3}
            className="mb-4"
          />
          {updateError && (
            <p className="mb-3 text-sm text-red-600">{updateError}</p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleRequestCancellation}
              disabled={!cancelReason.trim() || requestingCancellation}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {requestingCancellation ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Request'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setCancelModalOpen(false); setCancelReason(''); }}
              disabled={requestingCancellation}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}