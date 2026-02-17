export interface Hotel {
  id: string;
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
  images: string[]; // Array of image URLs
  amenities: string[]; // Array of amenity IDs
  rating?: number;
  vendorId: string; // ID of the vendor who owns this hotel
  createdAt: Date;
  updatedAt: Date;
  
  // Module-specific fields
  whitelabelConfig?: WhitelabelConfig;
}

export interface WhitelabelConfig {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customDomain?: string;
}

export interface Room {
  id: string;
  hotelId: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number;
  images: string[]; // Array of image URLs
  amenities: string[]; // Array of amenity IDs
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  amenities: string[]; // Array of amenity IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'room' | 'hotel';
  createdAt: Date;
  updatedAt: Date;
}
