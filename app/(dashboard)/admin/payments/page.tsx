'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  EyeIcon, 
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from '@/lib/services/toast.service';
import { Select } from '@/components/ui/select';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  vendorName?: string;
  vendorId?: string;
  planName?: string;
  planId?: string;
  bookingId?: string;
  hotelName?: string;
  hotelId?: string;
  customerName?: string;
  customerId?: string;
  paymentType: 'SUBSCRIPTION' | 'BOOKING' | 'OTHER';
  transactionReference?: string;
  currency?: string;
  description?: string;
}

interface PaymentDetail extends Payment {
  vendor?: {
    id: string;
    name: string;
    email: string;
  };
  subscriptionPlan?: {
    id: string;
    name: string;
    description: string;
    price: number;
    billingCycle: string;
  };
  booking?: {
    id: string;
  };
  updatedAt?: string;
}

// Utility functions - moved outside components to be globally accessible
const getStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
    case 'processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'failed':
    case 'declined':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'refunded':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getPaymentTypeLabel = (type: string) => {
  switch (type) {
    case 'SUBSCRIPTION':
      return 'Subscription';
    case 'BOOKING':
      return 'Booking';
    case 'OTHER':
      return 'Other';
    default:
      return type;
  }
};

// Payment Details Modal Component
const PaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  paymentId: string | null;
}) => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPaymentDetails();
    }
  }, [isOpen, paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/payments/${paymentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }
      
      const data = await response.json();
      setPayment(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error fetching payment details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        
        {/* Modal body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          ) : payment ? (
            <div className="space-y-6">
              {/* Transaction Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Transaction Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</p>
                    <p className="text-gray-900 dark:text-white font-mono">{payment.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</p>
                    <p className="text-gray-900 dark:text-white">{payment.transactionReference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount, payment.currency || 'NGN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                      {payment.status === 'completed' || payment.status === 'success' ? 
                        <><CheckIcon className="h-3 w-3" /> {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</> : 
                        payment.status === 'failed' || payment.status === 'declined' ?
                        <><XMarkIcon className="h-3 w-3" /> {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</> :
                        payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
                      }
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</p>
                    <p className="text-gray-900 dark:text-white">{payment.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Type</p>
                    <p className="text-gray-900 dark:text-white">{getPaymentTypeLabel(payment.paymentType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated</p>
                    <p className="text-gray-900 dark:text-white">{payment.updatedAt ? formatDate(payment.updatedAt) : 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {payment.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{payment.description}</p>
                </div>
              )}
              
              {/* Vendor Information */}
              {payment.vendor && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Vendor Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                      <Link 
                        href={`/admin/users/${payment.vendor.id}`}
                        className="text-primary hover:underline"
                      >
                        {payment.vendor.name}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">{payment.vendor.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Subscription Plan Information */}
              {payment.subscriptionPlan && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Subscription Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</p>
                      <Link 
                        href={`/admin/subscription-plans/${payment.subscriptionPlan.id}`}
                        className="text-primary hover:underline"
                      >
                        {payment.subscriptionPlan.name}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</p>
                      <p className="text-gray-900 dark:text-white">
                        {formatCurrency(payment.subscriptionPlan.price, payment.currency || 'NGN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Cycle</p>
                      <p className="text-gray-900 dark:text-white">
                        {payment.subscriptionPlan.billingCycle.charAt(0).toUpperCase() + 
                         payment.subscriptionPlan.billingCycle.slice(1)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                      <p className="text-gray-900 dark:text-white">
                        {payment.subscriptionPlan.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Booking Information (if applicable) */}
              {payment.booking && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Booking Details
                  </h4>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Booking ID</p>
                    <Link 
                      href={`/admin/bookings/${payment.booking.id}`}
                      className="text-primary hover:underline"
                    >
                      {payment.booking.id}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No payment information found
            </div>
          )}
        </div>
        
        {/* Modal footer */}
        <div className="flex items-center justify-end p-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // 'all' or one of 'SUBSCRIPTION' | 'BOOKING' | 'OTHER'
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [page, pageSize, searchQuery, sortColumn, sortDirection, filterType, filterStatus, dateFrom, dateTo]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortColumn,
        sortDirection,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Append a single `type` parameter when a specific type is selected
      if (filterType && filterType !== 'all') {
        params.append('type', filterType);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      
      if (dateTo) {
        params.append('dateTo', dateTo);
      }
      
      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      
      setPayments(data.payments);
      setTotalItems(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const openPaymentModal = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPaymentId(null);
  };

  const exportPayments = async () => {
    try {
      // Build query params for export
      const params = new URLSearchParams({
        export: 'csv',
      });
      
      if (filterType && filterType !== 'all') {
        params.append('type', filterType);
      }
      
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      
      if (dateTo) {
        params.append('dateTo', dateTo);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Trigger download
      window.open(`/api/admin/payments/export?${params.toString()}`, '_blank');
    } catch (err) {
      console.error('Error exporting payments:', err);
      setError('Failed to export payments');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <button 
          onClick={exportPayments}
          className="flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
          Export
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="mt-2 rounded-md bg-red-50 text-sm font-medium text-red-800 hover:underline dark:bg-transparent dark:text-red-200"
                onClick={fetchPayments}
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="mr-1 h-4 w-4" />
                  Retry
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Type
          </label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 block w-full min-h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="BOOKING">Booking</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-full min-h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date From
          </label>
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 block w-full min-h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date To
          </label>
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 block w-full min-h-10 p-2 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
          />
        </div>
      </div>

      <DataTable
        data={payments}
        columns={[
          { 
            key: 'id', 
            title: 'Transaction ID',
            render: (payment) => (
              <span className="font-mono text-xs">{payment.id.slice(0, 8)}...</span>
            )
          },
          { 
            key: 'amount', 
            title: 'Amount', 
            sortable: true,
            render: (payment) => formatCurrency(payment.amount, payment.currency || 'NGN')
          },
          { 
            key: 'paymentType', 
            title: 'Type', 
            sortable: true,
            render: (payment) => getPaymentTypeLabel(payment.paymentType)
          },
          { 
            key: 'paymentMethod', 
            title: 'Method',
            render: (payment) => payment.paymentMethod
          },
          { 
            key: 'entity', 
            title: 'For', 
            render: (payment) => {
              if (payment.paymentType === 'SUBSCRIPTION' && payment.planName) {
                return (
                  <div>
                    <span className="block text-sm font-medium">Plan: {payment.planName}</span>
                    {payment.vendorName && (
                      <Link 
                        href={`/admin/users/${payment.vendorId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {payment.vendorName}
                      </Link>
                    )}
                  </div>
                );
              } else if (payment.paymentType === 'BOOKING' && payment.hotelName) {
                return (
                  <div>
                    <span className="block text-sm font-medium">Booking: {payment.bookingId?.slice(0, 8)}</span>
                    <Link 
                      href={`/admin/hotels/${payment.hotelId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {payment.hotelName}
                    </Link>
                  </div>
                );
              }
              return 'N/A';
            }
          },
          { 
            key: 'status', 
            title: 'Status', 
            sortable: true,
            render: (payment) => (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                {payment.status === 'completed' || payment.status === 'success' ? 
                  <><CheckIcon className="h-3 w-3" /> {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</> : 
                  payment.status === 'failed' || payment.status === 'declined' ?
                  <><XMarkIcon className="h-3 w-3" /> {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</> :
                  payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
                }
              </span>
            )
          },
          { 
            key: 'createdAt', 
            title: 'Date', 
            sortable: true,
            render: (payment) => formatDate(payment.createdAt)
          },
          { 
            key: 'actions', 
            title: 'Actions',
            render: (payment) => (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => openPaymentModal(payment.id)}
                  className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            )
          },
        ]}
        pagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        totalItems={totalItems}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSort={handleSort}
        searchable={true}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Payment Details Modal */}
      <PaymentModal 
        isOpen={modalOpen} 
        onClose={closeModal} 
        paymentId={selectedPaymentId} 
      />
    </div>
  );
}