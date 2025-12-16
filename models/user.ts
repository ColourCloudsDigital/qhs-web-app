export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  VENDOR = 'VENDOR',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Hashed password
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuperAdmin extends User {
  role: UserRole.SUPER_ADMIN;
}

export interface Vendor extends User {
  role: UserRole.VENDOR;
  hotelId: string;
  subscription: {
    plan: string;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
  };
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

export interface Customer extends User {
  role: UserRole.CUSTOMER;
  phone?: string;
  address?: string;
  bookings: string[]; // Array of booking IDs
}

export interface Staff extends User {
  role: UserRole.STAFF;
  hotelId: string;
  vendorId: string;
  permissions: string[]; // Array of permission keys
  position: string;
}
