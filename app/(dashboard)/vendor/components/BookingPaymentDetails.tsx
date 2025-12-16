'use client';

import { motion } from 'framer-motion';
import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}

interface BookingPaymentDetailsProps {
  booking: any;
  payments: Payment[];
}

export default function BookingPaymentDetails({ booking, payments = [] }: BookingPaymentDetailsProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  // Get payment status icon
  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'PAID':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    if (!method) return 'Unknown';
    
    return method.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Payment Summary */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center">
            <div className={`mr-3 flex h-10 w-10 items-center justify-center rounded-full ${
              booking.paymentStatus.toUpperCase() === 'PAID' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
              booking.paymentStatus.toUpperCase() === 'PENDING' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
              'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {getStatusIcon(booking.paymentStatus)}
      </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(booking.totalAmount)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Payment {booking.paymentStatus.toLowerCase()}
              </p>
            </div>
              </div>
            </div>
      </motion.div>

      {/* Payment Transactions */}
      {payments.length > 0 ? (
        <motion.div variants={itemVariants} className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Method
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {payments.map((payment) => (
                <motion.tr 
                  key={payment.id}
                  variants={itemVariants}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatPaymentMethod(payment.paymentMethod)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="flex items-center">
                      {getStatusIcon(payment.status)}
                      <span className="ml-1.5">{payment.status}</span>
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50"
        >
          <CreditCard className="mb-2 h-10 w-10 text-gray-400" />
          <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">No payment transactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No payment records found for this booking.
          </p>
        </motion.div>
      )}

      {/* Payment Due Information */}
      {booking.paymentStatus.toUpperCase() !== 'PAID' && (
        <motion.div 
          variants={itemVariants}
          className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10"
                >
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
                        <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Payment Required
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                <p>
                  {booking.paymentStatus.toUpperCase() === 'PENDING'
                    ? 'This booking requires payment. Process payment to confirm the reservation.'
                    : booking.paymentStatus.toUpperCase() === 'PARTIALLY_PAID'
                    ? `A balance of ${formatCurrency(booking.totalAmount - (payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)))} is pending.`
                    : 'Payment information is not available.'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}