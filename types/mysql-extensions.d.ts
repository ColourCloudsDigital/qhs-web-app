// MySQL Database Extensions and Custom Types
// This file defines additional types and extensions for our MySQL database models

declare global {
  namespace MySQLExtensions {
    // Extended User Model types for authentication and verification
    interface UserExtensions {
      emailVerified?: Date | string | null;
      verificationToken?: string | null;
      verificationExpires?: Date | string | null;
      resetToken?: string | null;
      resetExpires?: Date | string | null;
    }

    // Extended Booking Model types
    interface BookingExtensions {
      specialRequests?: string | null;
      guestNotes?: string | null;
      internalNotes?: string | null;
    }

    // Extended Hotel Model types
    interface HotelExtensions {
      metadata?: string | null; // JSON string for additional data
      settings?: string | null; // JSON string for hotel-specific settings
    }
  }
}

// MySQL Query Result Types
export interface MySQLQueryResult {
  insertId?: number;
  affectedRows?: number;
  changedRows?: number;
  warningCount?: number;
}

// Common MySQL Model Base
export interface MySQLBaseModel {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Extended User Model for MySQL
export interface MySQLUser extends MySQLBaseModel, MySQLExtensions.UserExtensions {
  email: string;
  name: string | null;
  role: string;
  password?: string;
  image?: string | null;
}

// Extended Booking Model for MySQL
export interface MySQLBooking extends MySQLBaseModel, MySQLExtensions.BookingExtensions {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

// Extended Hotel Model for MySQL
export interface MySQLHotel extends MySQLBaseModel, MySQLExtensions.HotelExtensions {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  vendorId: string;
  isActive: boolean;
}

export {};