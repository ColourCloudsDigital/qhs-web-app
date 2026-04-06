import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface OrderItem {
  id: string;        // menuItemId
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  paymentMethod: string;
  paymentStatus: string;
  vat: number;
  vendorId?: string;
  table?: string;
  createdAt?: string;
}

interface OrderStore {
  activeOrderId: string | null;
  orders: Order[];

  createOrder: (vendorId?: string) => string;
  getActiveOrder: () => Order | null;
  getOrderTotal: (orderId: string) => number;

  addItemToActiveOrder: (item: Omit<OrderItem, 'quantity'>) => void;
  removeItemFromActiveOrder: (itemId: string) => void;

  setPaymentMethod: (orderId: string, method: string) => void;
  setPaymentStatus: (orderId: string, status: string) => void;
  clearActiveOrder: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  activeOrderId: null,
  orders: [],

  createOrder: (vendorId) => {
    const id = uuidv4();
    const newOrder: Order = {
      id,
      items: [],
      paymentMethod: 'Cash',
      paymentStatus: 'Not Paid',
      vat: 0,
      vendorId,
    };
    set(state => ({
      orders: [...state.orders, newOrder],
      activeOrderId: id,
    }));
    return id;
  },

  getActiveOrder: () => {
    const { activeOrderId, orders, createOrder } = get();
    if (!activeOrderId) {
      // Auto-create an order if none exists
      const id = createOrder();
      return get().orders.find(o => o.id === id) || null;
    }
    return orders.find(o => o.id === activeOrderId) || null;
  },

  getOrderTotal: (orderId) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  addItemToActiveOrder: (item) => {
    const { activeOrderId, orders, createOrder } = get();
    let orderId = activeOrderId;
    if (!orderId) {
      orderId = createOrder();
    }
    set(state => ({
      orders: state.orders.map(order => {
        if (order.id !== orderId) return order;
        const existing = order.items.find(i => i.id === item.id);
        if (existing) {
          return {
            ...order,
            items: order.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { ...order, items: [...order.items, { ...item, quantity: 1 }] };
      }),
    }));
  },

  removeItemFromActiveOrder: (itemId) => {
    const { activeOrderId } = get();
    if (!activeOrderId) return;
    set(state => ({
      orders: state.orders.map(order => {
        if (order.id !== activeOrderId) return order;
        const existing = order.items.find(i => i.id === itemId);
        if (!existing) return order;
        if (existing.quantity <= 1) {
          return { ...order, items: order.items.filter(i => i.id !== itemId) };
        }
        return {
          ...order,
          items: order.items.map(i =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }),
    }));
  },

  setPaymentMethod: (orderId, method) => {
    set(state => ({
      orders: state.orders.map(o =>
        o.id === orderId ? { ...o, paymentMethod: method } : o
      ),
    }));
  },

  setPaymentStatus: (orderId, status) => {
    set(state => ({
      orders: state.orders.map(o =>
        o.id === orderId ? { ...o, paymentStatus: status } : o
      ),
    }));
  },

  clearActiveOrder: () => {
    const { activeOrderId } = get();
    set(state => ({
      orders: state.orders.filter(o => o.id !== activeOrderId),
      activeOrderId: null,
    }));
  },
}));
