import { create } from 'zustand';

export interface RecentBooking {
  id: string;
  roomId: string;
  roomName: string;
  hotelId: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  price: number;
  bookedAt: string;
}

interface BookingStore {
  [x: string]: any;
  recentBookings: RecentBooking[];
  addBooking: (booking: RecentBooking) => void;
  clearBookings: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  recentBookings: [],
  addBooking: (booking) =>
    set((state) => ({
      recentBookings: [booking, ...state.recentBookings].slice(0, 10), // Keep last 10
    })),
  clearBookings: () => set({ recentBookings: [] }),
}));
