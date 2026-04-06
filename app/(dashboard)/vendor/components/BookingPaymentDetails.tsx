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
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(booking.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Amount Paid</p>
              <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(booking.amountPaid ?? payments.reduce((s: number, p: Payment) => p.status.toUpperCase() === 'COMPLETED' ? s + p.amount : s, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Balance Due</p>
              <p className={`mt-1 text-lg font-bold ${(booking.balance ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatCurrency(booking.balance ?? Math.max(0, booking.totalAmount - payments.reduce((s: number, p: Payment) => p.status.toUpperCase() === 'COMPLETED' ? s + p.amount : s, 0)))}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              booking.paymentStatus?.toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-600' :
              booking.paymentStatus?.toUpperCase() === 'PENDING' ? 'bg-amber-100 text-amber-600' :
              'bg-red-100 text-red-600'
            }`}>
              {getStatusIcon(booking.paymentStatus || '')}
            </div>
            <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
              Payment {(booking.paymentStatus || '').toLowerCase()}
            </span>
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
      {(booking.balance ?? 0) > 0 && (
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
                Balance Due
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                <p>
                  {formatCurrency(booking.balance)} remaining out of {formatCurrency(booking.totalAmount)}.
                  {(booking.amountPaid ?? 0) > 0 && ` ${formatCurrency(booking.amountPaid)} has been paid.`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}