export enum ModuleType {
  ROOM_BOOKING = 'ROOM_BOOKING',
  FACILITY_MANAGEMENT = 'FACILITY_MANAGEMENT',
  QR_MENU = 'QR_MENU',
  WHITE_LABEL = 'WHITE_LABEL',
  BLOG = 'BLOG'
}

export interface Module {
  id: string;
  type: ModuleType;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeature[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanFeature {
  moduleType: ModuleType;
  limits: {
    [key: string]: number; // e.g., { "rooms": 10, "staff": 5 }
  };
  isIncluded: boolean;
}

// Facility Management Module
export interface FacilityTask {
  id: string;
  hotelId: string;
  title: string;
  description: string;
  assignedTo: string; // Staff ID
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  completedAt?: Date;
  category: 'cleaning' | 'maintenance' | 'repair' | 'procurement' | 'other';
  roomId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// QR Menu Module
export interface Menu {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  isActive: boolean;
  categories: MenuCategory[];
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  isAvailable: boolean;
  allergens?: string[];
  order: number;
}

// Blog Module
export interface BlogPost {
  id: string;
  hotelId: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string; // User ID
  featuredImage?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
