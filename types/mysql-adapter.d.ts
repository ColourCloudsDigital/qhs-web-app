import { Pool, RowDataPacket, ResultSetHeader, QueryOptions } from 'mysql2/promise';

/**
 * Base MySQL row type for results from queries
 */
export type MySQLRow = Record<string, any> & RowDataPacket;

/**
 * Type for query parameters
 */
export type QueryParams = any[] | Record<string, any>;

/**
 * Options for findMany, findUnique etc. operations
 */
export interface QueryOptions<T = any, I = any> {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
  include?: I;
  select?: Record<string, boolean>;
  cursor?: Record<string, any>;
  distinct?: string[];
}

/**
 * Transaction operation function type
 */
export type TransactionOperation<T = any> = (connection: Pool) => Promise<T>;

/**
 * MySQL Prisma-like client with typed models
 */
export interface MySQLPrismaClient {
  /**
   * Execute raw SQL query
   */
  query<T = MySQLRow>(sql: string, params?: QueryParams): Promise<T[]>;

  /**
   * Execute transaction with multiple operations
   */
  $transaction<T = any>(
    operations: TransactionOperation<T>[] | TransactionOperation<T>
  ): Promise<T>;

  /**
   * User model operations
   */
  user: ModelOperations<UserModel, UserInclude>;

  /**
   * Room model operations
   */
  room: ModelOperations<RoomModel, RoomInclude>;

  /**
   * Booking model operations
   */
  booking: ModelOperations<BookingModel, BookingInclude>;

  /**
   * Hotel model operations
   */
  hotel: ModelOperations<HotelModel, HotelInclude>;

  /**
   * Other models...
   */
  [key: string]: ModelOperations<any, any> | any;
}

/**
 * Generic model CRUD operations interface
 */
export interface ModelOperations<T, I = any> {
  findUnique(options: { where: Record<string, any>; include?: I }): Promise<T | null>;
  findFirst(options: QueryOptions<T, I>): Promise<T | null>;
  findMany(options: QueryOptions<T, I>): Promise<T[]>;
  create(options: { data: Partial<T> }): Promise<T>;
  update(options: { where: Record<string, any>; data: Partial<T> }): Promise<T>;
  delete(options: { where: Record<string, any> }): Promise<{ id: string }>;
  count(options: { where?: Record<string, any> }): Promise<number>;
}

/**
 * Base model fields
 */
interface BaseModel {
  id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * User model
 */
export interface UserModel extends BaseModel {
  email: string;
  name: string | null;
  role: string;
  password?: string;
  image?: string | null;
  emailVerified?: Date | string | null;
  verificationToken?: string | null;
  verificationExpires?: Date | string | null;
  resetToken?: string | null;
  resetExpires?: Date | string | null;
  
  // Relations (populated when included)
  superAdmin?: SuperAdminModel | null;
  vendor?: VendorModel | null;
  customer?: CustomerModel | null;
  staff?: StaffModel | null;
}

/**
 * User includes
 */
export interface UserInclude {
  superAdmin?: boolean;
  vendor?: boolean;
  customer?: boolean;
  staff?: boolean;
}

/**
 * Room model
 */
export interface RoomModel extends BaseModel {
  hotelId: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number | null;
  images: string; // JSON string of image URLs
  status: string;
  roomNumbers?: string | null; // JSON string of room numbers
  
  // Relations (populated when included)
  hotel?: HotelModel;
  amenities?: RoomAmenityModel[];
  bookings?: BookingModel[];
}

/**
 * Room includes
 */
export interface RoomInclude {
  hotel?: boolean | {
    select?: Record<string, boolean>
  };
  amenities?: boolean | {
    include?: {
      amenity?: boolean
    }
  };
  bookings?: boolean | {
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  };
}

/**
 * Booking model
 */
export interface BookingModel extends BaseModel {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string | null;
  
  // Relations (populated when included)
  hotel?: HotelModel;
  room?: RoomModel;
  customer?: CustomerModel;
  payments?: PaymentModel[];
}

/**
 * Booking includes
 */
export interface BookingInclude {
  hotel?: boolean;
  room?: boolean | {
    include?: {
      hotel?: boolean;
    }
  };
  customer?: boolean | {
    include?: {
      user?: boolean | {
        select?: Record<string, boolean>
      }
    }
  };
  payments?: boolean;
}

/**
 * Hotel model
 */
export interface HotelModel extends BaseModel {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  phone: string;
  email: string;
  website?: string;
  images: string; // JSON string of image URLs
  rating?: number;
  isActive: boolean;
  vendorId: string;
  
  // Relations (populated when included)
  vendor?: VendorModel;
  rooms?: RoomModel[];
  amenities?: HotelAmenityModel[];
  bookings?: BookingModel[];
}

/**
 * Hotel includes
 */
export interface HotelInclude {
  vendor?: boolean;
  rooms?: boolean;
  amenities?: boolean | {
    include?: {
      amenity?: boolean
    }
  };
  bookings?: boolean;
}

// Additional models (simplified for brevity)
export interface SuperAdminModel extends BaseModel {
  userId: string;
}

export interface VendorModel extends BaseModel {
  userId: string;
  businessName?: string;
  // other vendor fields
}

export interface CustomerModel extends BaseModel {
  userId: string;
  // other customer fields
  user?: UserModel;
}

export interface StaffModel extends BaseModel {
  userId: string;
  hotelId: string;
  // other staff fields
}

export interface RoomAmenityModel {
  id: string;
  roomId: string;
  amenityId: string;
  amenity?: AmenityModel;
}

export interface HotelAmenityModel {
  hotelId: string;
  amenityId: string;
  Amenity?: AmenityModel;
}

export interface AmenityModel extends BaseModel {
  name: string;
  description?: string;
  icon?: string;
  category?: string;
}

export interface PaymentModel extends BaseModel {
  bookingId: string;
  amount: number;
  vendorAmount: number;
  status: string;
  paymentMethod: string;
  // other payment fields
} 