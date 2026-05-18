'use client';

import { useState, useEffect } from 'react';
import { Trash2, Loader2, Receipt, CreditCard, Wifi } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface OrderedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ActiveBill {
  id: string;
  displayName: string;
  billType: string;
  balance: number;
  customerId?: string;
  corporationId?: string;
}

interface OrderSummaryProps {
  orderId: string;
  table: string;
  people: number;
  orderedItems: OrderedItem[];
  paymentMethod: string;
  paymentStatus: string;
  vat: number;
  hotelId?: string;
  getOrderTotal: (orderId: string) => number;
  setPaymentMethod: (orderId: string, method: string) => void;
  setPaymentStatus: (orderId: string, status: string) => void;
  removeItemFromActiveOrder: (itemId: string) => void;
  onPlaceOrder: () => Promise<void>;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer', 'Bill'];
const PAYMENT_STATUSES = ['Pending', 'Paid'];

export default function OrderSummary({
  orderId, orderedItems, paymentMethod, paymentStatus, vat, hotelId,
  getOrderTotal, setPaymentMethod, setPaymentStatus,
  removeItemFromActiveOrder, onPlaceOrder,
}: OrderSummaryProps) {
  const { toast } = useToast();
  const [placing, setPlacing] = useState(false);

  // Bill state
  const [activeBills, setActiveBills] = useState<ActiveBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState('');

  const subtotal = getOrderTotal(orderId);
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;
  const hasItems = orderedItems.length > 0;

  // Load active bills when Bill method is selected
  useEffect(() => {
    if (paymentMethod === 'Bill') {
      setLoadingBills(true);
      const url = hotelId
        ? `/api/staff/bills/active?hotelId=${hotelId}`
        : '/api/staff/bills/active';
      fetch(url)
        .then(r => r.json())
        .then(d => setActiveBills(d.bills || []))
        .catch(() => toast({ title: 'Failed to load bills', variant: 'destructive' }))
        .finally(() => setLoadingBills(false));
    }
  }, [paymentMethod, hotelId]);

  const handlePlace = async () => {
    if (placing || !hasItems) return;

    if (paymentMethod === 'Bill' && !selectedBillId) {
      toast({
        title: 'Select a bill account',
        description: 'Choose a customer or corporation bill to charge.',
        variant: 'destructive',
      });
      return;
    }

    setPlacing(true);
    try {
      await onPlaceOrder();
      if (paymentMethod === 'Bill' && selectedBillId) {
        await linkOrderToBill(selectedBillId);
      }
    } finally {
      setPlacing(false);
    }
  };

  const linkOrderToBill = async (billId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, paymentStatus: 'Bill' }),
      });
      toast({ title: 'Charged to bill', description: 'Order added to bill account.' });
    } catch {
      toast({ title: 'Failed to link bill', variant: 'destructive' });
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
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.price)} × {item.quantity}
                </p>
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

      {/* Payment method — all four work identically: one click to select */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m}
              onClick={() => {
                setPaymentMethod(orderId, m);
                // Auto-set status when Bill is chosen
                if (m === 'Bill') setPaymentStatus(orderId, 'Bill');
              }}
              disabled={placing}
              className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                paymentMethod === m
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {m === 'Bill' && <Receipt className="h-3 w-3" />}
              {m === 'Transfer' && <Wifi className="h-3 w-3" />}
              {m === 'Card' && <CreditCard className="h-3 w-3" />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Payment status — shown for Cash, Card, Transfer */}
      {paymentMethod !== 'Bill' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Payment Status
          </label>
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
      )}

      {/* Bill method — customer/corp selector */}
      {paymentMethod === 'Bill' && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2 dark:bg-purple-900/10">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Receipt className="h-3.5 w-3.5" /> Charge to Bill Account
          </p>
          {loadingBills ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />Loading bills...
            </div>
          ) : activeBills.length === 0 ? (
            <p className="text-xs text-gray-500">
              No active bill accounts found. Create one in Customers → Bills.
            </p>
          ) : (
            <select
              value={selectedBillId}
              onChange={e => setSelectedBillId(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select bill account...</option>
              {activeBills.map(b => (
                <option key={b.id} value={b.id}>
                  {b.displayName} — Balance: {formatCurrency(b.balance)}
                </option>
              ))}
            </select>
          )}
          {selectedBillId && (
            <p className="text-xs text-purple-600">
              {formatCurrency(total)} will be added to this bill.
            </p>
          )}
        </div>
      )}

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
