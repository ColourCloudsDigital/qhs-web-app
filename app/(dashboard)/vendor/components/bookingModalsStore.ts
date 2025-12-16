import { create } from 'zustand';

export type ModalType = null | 'view' | 'edit' | 'documents';

interface BookingModalState {
  modalType: ModalType;
  bookingId: string | null;
  setModal: (type: ModalType, bookingId: string | null) => void;
  closeModal: () => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
}

export const useBookingModalsStore = create<BookingModalState>((set) => ({
  modalType: null,
  bookingId: null,
  setModal: (type, bookingId) => set({ modalType: type, bookingId }),
  closeModal: () => set({ modalType: null, bookingId: null }),
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
})); 