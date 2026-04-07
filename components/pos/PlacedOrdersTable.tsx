'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Eye, Truck, X, Edit2, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import toast from '@/lib/toast';

interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName?: string;
  quantity: number;
  price: number;
}

interface PlacedOrder {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

interface PlacedOrdersTableProps {
  orders: PlacedOrder[];
  page: number;
  total: number;
  limit: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  onEditOrder: (order: PlacedOrder) => void;
}

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function PlacedOrdersTable({
  orders, page, total, limit, isLoading = false,
  onPageChange, onLimitChange, onRefresh, onEditOrder,
}: PlacedOrdersTableProps) {
  const [viewOrder, setViewOrder] = useState<PlacedOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const updateStatus = async (orderId: string, status: 'delivered' | 'cancelled') => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success(`Order marked as ${status}.`);
      onRefresh();
      if (viewOrder?.id === orderId) setViewOrder(null);
    } catch (err: any) {
      toast.error(err.message || `Failed to mark as ${status}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} placed order{total !== 1 ? 's' : ''}</p>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="group flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-900 hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-gray-900"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 duration-300'}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-gray-400 dark:border-gray-700">
          <p className="text-sm">No placed orders.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Order ID', 'Items', 'Total', 'Method', 'Payment', 'Date', 'Actions'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{order.items?.reduce((s, i) => s + i.quantity, 0) ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(parseFloat(String(order.totalAmount)))}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.paymentStatus === 'Paid' || order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                      order.paymentStatus === 'Pending' || order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{order.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewOrder(order)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => onEditOrder(order)} className="rounded p-1 text-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'delivered')}
                        disabled={updatingId === order.id}
                        className="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 disabled:opacity-40"
                        title="Mark Delivered"
                      >
                        {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 disabled:opacity-40"
                        title="Cancel Order"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select value={limit} onChange={e => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
            className="rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2">Page {page} of {totalPages}</span>
          <button onClick={() => onPageChange(1)} disabled={page <= 1 || isLoading} className="rounded border p-1 disabled:opacity-40 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronsLeft className="h-4 w-4" /></button>
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading} className="rounded border p-1 disabled:opacity-40 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading} className="rounded border p-1 disabled:opacity-40 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => onPageChange(totalPages)} disabled={page >= totalPages || isLoading} className="rounded border p-1 disabled:opacity-40 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronsRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Detail modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewOrder(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Order #{viewOrder.id.slice(0, 8).toUpperCase()}</h3>
              <button onClick={() => setViewOrder(null)} className="text-xl leading-none text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-700">
              <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{new Date(viewOrder.createdAt).toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">Payment</p><p className="font-medium">{viewOrder.paymentMethod}</p></div>
              <div><p className="text-xs text-gray-500">Payment Status</p><p className="font-medium">{viewOrder.paymentStatus}</p></div>
              <div><p className="text-xs text-gray-500">Total</p><p className="font-semibold text-primary">{formatCurrency(parseFloat(String(viewOrder.totalAmount)))}</p></div>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Items</p>
            <div className="max-h-48 space-y-2 overflow-y-auto mb-4">
              {viewOrder.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700">
                  <div>
                    <p className="text-sm font-medium">{item.menuItemName || `Item #${item.menuItemId?.slice(0, 6).toUpperCase()}`}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onEditOrder(viewOrder); setViewOrder(null); }}
                className="flex-1 rounded-xl border border-blue-300 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                <Edit2 className="inline h-4 w-4 mr-1" />Edit
              </button>
              <button
                onClick={() => updateStatus(viewOrder.id, 'delivered')}
                disabled={updatingId === viewOrder.id}
                className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40"
              >
                {updatingId === viewOrder.id ? <Loader2 className="inline h-4 w-4 animate-spin mr-1" /> : <Truck className="inline h-4 w-4 mr-1" />}
                Delivered
              </button>
              <button
                onClick={() => updateStatus(viewOrder.id, 'cancelled')}
                disabled={updatingId === viewOrder.id}
                className="flex-1 rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <X className="inline h-4 w-4 mr-1" />Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
