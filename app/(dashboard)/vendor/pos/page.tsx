'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useHotel } from '@/contexts/HotelContext';
import { useOrderStore } from '@/store/orderStore';
import toast from '@/lib/toast';
import FoodMenu from '@/components/pos/FoodMenu';
import OrderLine from '@/components/pos/OrderLine';
import OrderSummary from '@/components/pos/OrderSummary';
import OrdersTable from '@/components/pos/OrdersTable';
import Modal from '@/components/ui/Modal';
import DateRangePicker from '@/components/booking/DateRangePicker';

export default function VendorPOSPage() {
  const { data: session } = useSession();
  const { currentHotel } = useHotel();

  const [menus, setMenus] = useState<any>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'current' | 'processed'>('current');

  const {
    addItemToActiveOrder,
    getActiveOrder,
    getOrderTotal,
    removeItemFromActiveOrder,
    setPaymentMethod,
    setPaymentStatus,
    clearActiveOrder,
  } = useOrderStore();

  const activeOrder = getActiveOrder();

  const [processedOrders, setProcessedOrders] = useState<any[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLimit, setOrdersLimit] = useState(15);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');

  // Fetch menu categories + items for the current hotel
  useEffect(() => {
    if (!currentHotel?.id) return;
    setLoadingMenus(true);
    fetch(`/api/menus/${currentHotel.id}`)
      .then(r => r.json())
      .then(data => setMenus(data))
      .catch(() => setMenus(null))
      .finally(() => setLoadingMenus(false));
  }, [currentHotel?.id]);

  // Fetch processed orders
  const fetchOrders = () => {
    setOrdersLoading(true);
    const params = new URLSearchParams({
      limit: ordersLimit.toString(),
      page: ordersPage.toString(),
    });
    if (currentHotel?.id) params.append('hotelId', currentHotel.id);
    if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod);
    if (filterPaymentStatus) params.append('paymentStatus', filterPaymentStatus);
    if (filterFromDate) params.append('startDate', filterFromDate);
    if (filterToDate) params.append('endDate', filterToDate);

    fetch(`/api/orders?${params}`)
      .then(r => r.json())
      .then(data => {
        setProcessedOrders(data.orders || []);
        setOrdersTotal(data.total || 0);
      })
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    if (selectedTab !== 'processed') return;
    if (!currentHotel?.id) return;
    fetchOrders();
  }, [selectedTab, ordersPage, ordersLimit, filterPaymentMethod, filterPaymentStatus, filterFromDate, filterToDate, currentHotel?.id]);

  const handlePlaceOrder = async () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      toast.warning('Add at least one item before placing an order.');
      return;
    }

    const subtotal = getOrderTotal(activeOrder.id);
    const vatAmount = subtotal * (activeOrder.vat / 100);
    const totalAmount = (subtotal + vatAmount).toFixed(2);

    const payload = {
      id: activeOrder.id,
      vat: activeOrder.vat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount,
      items: activeOrder.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        createdAt: new Date().toISOString(),
      })),
      paymentMethod: activeOrder.paymentMethod,
      paymentStatus: activeOrder.paymentStatus,
      hotelId: currentHotel?.id,
      vendorId: session?.user?.vendorId,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        clearActiveOrder();
        toast.success('Order placed successfully!');
        // Refresh processed orders if on that tab
        if (selectedTab === 'processed') setOrdersPage(1);
      } else {
        toast.error(data.error || 'Failed to place order.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row">
      {/* Left: menu + tabs */}
      <div className="flex flex-1 flex-col gap-4">
        <OrderLine
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          processedOrdersCount={ordersTotal}
        />

        {selectedTab === 'current' && (
          loadingMenus ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading menu...</div>
          ) : menus?.categories?.length ? (
            <FoodMenu categories={menus.categories} onAddItem={addItemToActiveOrder} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-sm">No menu items available.</p>
              <p className="text-xs mt-1">Add items via Menu Management first.</p>
            </div>
          )
        )}

        {selectedTab === 'processed' && (
          <div>
            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
              <select
                className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={filterPaymentMethod}
                onChange={e => { setOrdersPage(1); setFilterPaymentMethod(e.target.value); }}
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Transfer">Transfer</option>
              </select>
              <select
                className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={filterPaymentStatus}
                onChange={e => { setOrdersPage(1); setFilterPaymentStatus(e.target.value); }}
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Not Paid">Not Paid</option>
              </select>
              <button
                className="flex items-center gap-1.5 rounded border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => { setTempFromDate(filterFromDate); setTempToDate(filterToDate); setDateFilterModalOpen(true); }}
              >
                📅 Date Filter
              </button>
              {filterFromDate && filterToDate && (
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {filterFromDate} → {filterToDate}
                  <button onClick={() => { setFilterFromDate(''); setFilterToDate(''); setOrdersPage(1); }}>×</button>
                </span>
              )}
            </div>

            <OrdersTable
              orders={processedOrders}
              page={ordersPage}
              total={ordersTotal}
              limit={ordersLimit}
              isLoading={ordersLoading}
              onPageChange={setOrdersPage}
              onLimitChange={setOrdersLimit}
              onRefresh={fetchOrders}
            />

            <Modal isOpen={dateFilterModalOpen} onClose={() => setDateFilterModalOpen(false)} title="Filter by Date" maxWidth="sm">
              <div className="py-2">
                <DateRangePicker
                  startDate={tempFromDate}
                  endDate={tempToDate}
                  onStartDateChange={setTempFromDate}
                  onEndDateChange={setTempToDate}
                  label={{ start: 'From', end: 'To' }}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button className="rounded px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200" onClick={() => setDateFilterModalOpen(false)}>Cancel</button>
                  <button
                    className="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
                    disabled={!tempFromDate || !tempToDate}
                    onClick={() => { setFilterFromDate(tempFromDate); setFilterToDate(tempToDate); setOrdersPage(1); setDateFilterModalOpen(false); }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>

      {/* Right: order summary */}
      {selectedTab === 'current' && (
        <div className="w-full rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800 md:w-[340px]">
          <OrderSummary
            orderId={activeOrder?.id || ''}
            table={activeOrder?.table || ''}
            people={1}
            orderedItems={activeOrder?.items.filter(i => i.quantity > 0) || []}
            paymentMethod={activeOrder?.paymentMethod || 'Cash'}
            paymentStatus={activeOrder?.paymentStatus || 'Not Paid'}
            vat={activeOrder?.vat || 0}
            getOrderTotal={getOrderTotal}
            setPaymentMethod={setPaymentMethod}
            setPaymentStatus={setPaymentStatus}
            removeItemFromActiveOrder={removeItemFromActiveOrder}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      )}
    </div>
  );
}
