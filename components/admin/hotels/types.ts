// components/admin/hotels/types.ts

export interface Vendor {
  id: string;
  name: string;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export interface HotelFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  vendorId: string;
  amenities: string[];
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  isActive: boolean;
}

export interface HotelData extends HotelFormData {
  id: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  vendorName?: string;
  amenityDetails?: Amenity[];
  rooms?: RoomData[];
}

export interface ProcessedImage {
  path: string;
  width: number;
  height: number;
  size: number;
  type: string;
}

export interface RoomData {
  id: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number;
  images: string[];
  status: string;
  amenities: Amenity[];
}