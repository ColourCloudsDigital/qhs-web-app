export interface Amenity {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
  }
  
  export interface Vendor {
    id: string;
    name: string;
    companyName?: string;
  }
  
  export interface Room {
    id: string;
    name: string;
    type: string;
    description: string;
    capacity: number;
    pricePerNight: number;
    discountedPrice?: number;
    images?: string[];
    status: string;
    amenities?: string[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface RoomType {
    id: string;
    hotelId: string;
    name: string;
    description: string;
    basePrice: number;
    capacity: number;
    amenities?: RoomTypeAmenity[];
    rooms?: Room[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface RoomTypeAmenity {
    id: string;
    roomTypeId: string;
    amenityId: string;
    amenity?: Amenity;
  }
  
  export interface HotelFormData {
    id?: string;
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
    amenities: string[];
    logo: File | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    wifiEnabled: boolean;
    networkName: string;
    bandwidthLimit: number;
    isActive: boolean;
  }
  
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
    images: string[] | string;
    rating?: number;
    vendorId: string;
    vendor?: Vendor;
    amenities?: HotelAmenity[];
    rooms?: Room[];
    roomTypes?: RoomType[];
    whitelabelConfig?: WhitelabelConfig;
    wifiConfig?: WifiConfig;
    createdAt?: string;
    updatedAt?: string;
    isActive: boolean;
  }
  
  export interface HotelAmenity {
    id: string;
    hotelId: string;
    amenityId: string;
    amenity?: Amenity;
  }
  
  export interface WhitelabelConfig {
    logo?: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  }
  
  export interface WifiConfig {
    networkName: string;
    isEnabled: boolean;
    bandwidthLimit: number;
  }
  
  export interface RoomTypeFormData {
    name: string;
    description: string;
    basePrice: number;
    capacity: number;
    amenities: string[];
  }