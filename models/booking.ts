export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  customerId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Module-specific fields
  wifiCredentials?: WifiCredential[];
  keycardIds?: string[];
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export interface WifiCredential {
  username: string;
  password: string;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
}

export interface Keycard {
  id: string;
  hotelId: string;
  cardNumber: string;
  isActive: boolean;
  assignedTo?: string; // Booking ID
  validFrom?: Date;
  validTo?: Date;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  hotelId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  adminCommission: number;
  vendorAmount: number;
  taxAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}
