'use client';

import { useState, useEffect } from 'react';
import { Trash2, Loader2, X, ExternalLink, CreditCard, Receipt, Wifi } from 'lucide-react';
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
const PAYMENT_STATUSES = ['Pending', 'Bill', 'Paid'];

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

  // Card reference state
  const [cardRef, setCardRef] = useState('');
  const [showCardRef, setShowCardRef] = useState(false);

  // Transfer modal state
  const [transferModal, setTransferModal] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const subtotal = getOrderTotal(orderId);
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;
  const hasItems = orderedItems.length > 0;

  // Load active bills when Bill method is selected
  useEffect(() => {
    if (paymentMethod === 'Bill') {
      setLoadingBills(true);
      const url = hotelId ? `/api/staff/bills/active?hotelId=${hotelId}` : '/api/staff/bills/active';
      fetch(url)
        .then(r => r.json())
        .then(d => setActiveBills(d.bills || []))
        .catch(() => toast({ title: 'Failed to load bills', variant: 'destructive' }))
        .finally(() => setLoadingBills(false));
    }
  }, [paymentMethod, hotelId]);

  // Show card ref input when Card is selected
  useEffect(() => {
    setShowCardRef(paymentMethod === 'Card');
  }, [paymentMethod]);

  const handlePlace = async () => {
    if (placing || !hasItems) return;

    // Validate Bill selection
    if (paymentMethod === 'Bill' && !selectedBillId) {
      toast({ title: 'Select a bill account', description: 'Choose a customer or corporation bill to charge.', variant: 'destructive' });
      return;
    }

    setPlacing(true);
    try {
      await onPlaceOrder();
      // After placing, if Bill — link to bill
      if (paymentMethod === 'Bill' && selectedBillId) {
        await linkOrderToBill(selectedBillId);
      }
    } finally {
      setPlacing(false);
    }
  };

  const linkOrderToBill = async (billId: string) => {
    try {
      // Update order with billId
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, paymentStatus: 'Bill' }),
      });
      toast({ title: 'Charged to bill', description: `Order added to bill account.` });
    } catch {
      toast({ title: 'Failed to link bill', variant: 'destructive' });
    }
  };

  const initiateTransfer = async () => {
    if (!hasItems) return;
    setTransferLoading(true);
    try {
      const r = await fetch('/api/vendor/pos/initiate-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total.toFixed(2), orderId, email: guestEmail || undefined, hotelId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to initiate payment');
      setCheckoutUrl(d.checkoutUrl);
      setTransferRef(d.reference);
      toast({ title: 'Payment link generated', description: `Provider: ${d.provider}` });
    } catch (err: any) {
      toast({ title: 'Transfer failed', description: err.message, variant: 'destructive' });
    } finally {
      setTransferLoading(false);
    }
  };

  const confirmCardPayment = async () => {
    if (!cardRef.trim()) {
      toast({ title: 'Enter card reference', variant: 'destructive' }); return;
    }
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardReference: cardRef, paymentStatus: 'Paid' }),
      });
      setPaymentStatus(orderId, 'Paid');
      toast({ title: 'Card payment recorded', description: `Ref: ${cardRef}` });
      setCardRef('');
    } catch {
      toast({ title: 'Failed to record card payment', variant: 'destructive' });
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
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
                <button onClick={() => removeItemFromActiveOrder(item.id)} className="text-gray-400 transition-colors hover:text-red-500">
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
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        {vat > 0 && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>VAT ({vat}%)</span><span>{formatCurrency(vatAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Method</label>
        <div className="grid grid-cols-2 gap-1.5">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m}
              onClick={() => { setPaymentMethod(orderId, m); if (m === 'Bill') setPaymentStatus(orderId, 'Bill'); }}
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

      {/* Payment status (only shown when not Bill or Transfer) */}
      {paymentMethod !== 'Bill' && paymentMethod !== 'Transfer' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Status</label>
          <div className="flex gap-2">
            {PAYMENT_STATUSES.filter(s => s !== 'Bill').map(s => (
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

      {/* ── BILL METHOD: customer/corp selector ── */}
      {paymentMethod === 'Bill' && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-900/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Receipt className="h-3.5 w-3.5" /> Charge to Bill Account
          </p>
          {loadingBills ? (
            <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin" />Loading bills...</div>
          ) : activeBills.length === 0 ? (
            <p className="text-xs text-gray-500">No active bill accounts found. Create one in Customers → Bills.</p>
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
              Order total ({formatCurrency(total)}) will be added to this bill.
            </p>
          )}
        </div>
      )}

      {/* ── CARD METHOD: reference input ── */}
      {showCardRef && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5" /> Card Payment Reference
          </p>
          <p className="text-xs text-gray-500">Enter the POS terminal reference number for this card transaction.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={cardRef}
              onChange={e => setCardRef(e.target.value)}
              placeholder="e.g. TXN123456789"
              className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={confirmCardPayment}
              disabled={!cardRef.trim()}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSFER METHOD: initiate payment ── */}
      {paymentMethod === 'Transfer' && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
            <Wifi className="h-3.5 w-3.5" /> Online Transfer
          </p>
          <p className="text-xs text-gray-500">Generate a payment link for the customer to pay via Paystack, Flutterwave, or OPay.</p>
          <input
            type="email"
            value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)}
            placeholder="Customer email (optional)"
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {!checkoutUrl ? (
            <button
              onClick={() => { setTransferModal(true); initiateTransfer(); }}
              disabled={transferLoading || !hasItems}
              className="w-full rounded bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-1"
            >
              {transferLoading ? <><Loader2 className="h-3 w-3 animate-spin" />Generating...</> : 'Generate Payment Link'}
            </button>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-green-700 font-medium">Payment link ready!</p>
              <p className="text-xs text-gray-500 break-all">Ref: {transferRef}</p>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 w-full rounded bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Open Payment Page <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => { setCheckoutUrl(''); setTransferRef(''); }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Generate new link
              </button>
            </div>
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
          <><Loader2 className="h-4 w-4 animate-spin" />Placing Order...</>
        ) : (
          `Place Order · ${formatCurrency(total)}`
        )}
      </button>

      {/* Transfer modal overlay */}
      {transferModal && transferLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 text-center space-y-3 w-72">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="font-medium text-gray-900 dark:text-white">Generating payment link...</p>
            <p className="text-sm text-gray-500">Connecting to payment gateway</p>
            <button onClick={() => setTransferModal(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
