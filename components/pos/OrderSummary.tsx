'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OrderedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderSummaryProps {
  orderId: string;
  table: string;
  people: number;
  orderedItems: OrderedItem[];
  paymentMethod: string;
  paymentStatus: string;
  vat: number;
  getOrderTotal: (orderId: string) => number;
  setPaymentMethod: (orderId: string, method: string) => void;
  setPaymentStatus: (orderId: string, status: string) => void;
  removeItemFromActiveOrder: (itemId: string) => void;
  onPlaceOrder: () => Promise<void>;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer'];
const PAYMENT_STATUSES = ['Not Paid', 'Pending', 'Paid'];

export default function OrderSummary({
  orderId,
  orderedItems,
  paymentMethod,
  paymentStatus,
  vat,
  getOrderTotal,
  setPaymentMethod,
  setPaymentStatus,
  removeItemFromActiveOrder,
  onPlaceOrder,
}: OrderSummaryProps) {
  const [placing, setPlacing] = useState(false);

  const subtotal = getOrderTotal(orderId);
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;
  const hasItems = orderedItems.length > 0;

  const handlePlace = async () => {
    if (placing || !hasItems) return;
    setPlacing(true);
    try {
      await onPlaceOrder();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Order Summary</h2>

      {/* Items */}
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {!hasItems ? (
          <p className="py-6 text-center text-sm text-gray-400">No items added yet.</p>
        ) : (
          orderedItems.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.price)} × {item.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <button
                  onClick={() => removeItemFromActiveOrder(item.id)}
                  className="text-gray-400 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="space-y-1 border-t border-gray-200 pt-3 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {vat > 0 && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>VAT ({vat}%)</span>
            <span>{formatCurrency(vatAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Method</label>
        <div className="flex gap-2">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m}
              onClick={() => setPaymentMethod(orderId, m)}
              disabled={placing}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                paymentMethod === m
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Payment status */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Status</label>
        <div className="flex gap-2">
          {PAYMENT_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setPaymentStatus(orderId, s)}
              disabled={placing}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                paymentStatus === s
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Place order */}
      <button
        onClick={handlePlace}
        disabled={!hasItems || placing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {placing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Placing Order...
          </>
        ) : (
          `Place Order · ${formatCurrency(total)}`
        )}
      </button>
    </div>
  );
}
