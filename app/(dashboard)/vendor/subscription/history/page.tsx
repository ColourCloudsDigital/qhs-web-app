'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import toast from '@/lib/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface SubscriptionPayment {
  id: string;
  vendorId: string;
  subscriptionPlanId: string;
  amount: number;
  paymentDate: string;
  paymentReference: string;
  status: string;
  planName?: string;
  planPrice?: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<SubscriptionPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the vendor's subscription payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscriptions/vendor?includePayments=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment history');
        }
        
        const data = await response.json();
        
        if (data.paymentHistory) {
          setPaymentHistory(data.paymentHistory);
        } else {
          setPaymentHistory([]);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
        setError('Unable to load your payment history. Please try again later.');
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchPaymentHistory();
    }
  }, [session]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    if (!status) return <Badge>Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-500">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2 text-gray-500">Loading your payment history...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Payment History</h1>
        <Link href="/vendor/subscription">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Subscription
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No payment records found.</p>
              <p className="mt-2 text-sm">Your subscription payment history will appear here once you make a payment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate || payment.createdAt)}</TableCell>
                    <TableCell>{payment.planName || 'Unknown Plan'}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.paymentReference ? payment.paymentReference.substring(0, 12) + '...' : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
        <h4 className="font-medium">Need Help?</h4>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          If you have any questions about your billing or payments, please contact our support team.
        </p>
        <Button variant="outline" size="sm" className="mt-4">
          Contact Support
        </Button>
      </div>
    </div>
  );
} 