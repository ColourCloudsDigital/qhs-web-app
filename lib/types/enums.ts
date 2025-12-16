// Enum types previously imported from Prisma

export enum UserRole {
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  VENDOR = "VENDOR",
  CUSTOMER = "CUSTOMER",
  STAFF = "STAFF"
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED"
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  PAYSTACK = "PAYSTACK",
  FLUTTERWAVE = "FLUTTERWAVE"
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum TaskCategory {
  MAINTENANCE = "MAINTENANCE",
  HOUSEKEEPING = "HOUSEKEEPING",
  GUEST_REQUEST = "GUEST_REQUEST",
  OTHER = "OTHER"
}

export enum MaintenanceType {
  PLUMBING = "PLUMBING",
  ELECTRICAL = "ELECTRICAL",
  HVAC = "HVAC",
  FURNITURE = "FURNITURE",
  APPLIANCE = "APPLIANCE",
  OTHER = "OTHER"
}

export enum ModuleType {
  WIFI = "WIFI",
  KEYCARD = "KEYCARD",
  CCTV = "CCTV",
  MENU = "MENU",
  LOCK = "LOCK",
  MAINTENANCE = "MAINTENANCE",
  ANALYTICS = "ANALYTICS"
}

export enum NotificationType {
  SYSTEM = "SYSTEM",
  BOOKING = "BOOKING",
  PAYMENT = "PAYMENT",
  MAINTENANCE = "MAINTENANCE",
  PROMOTION = "PROMOTION",
  OTHER = "OTHER"
}

export enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ",
  ARCHIVED = "ARCHIVED"
}

export enum NotificationRecipient {
  ALL = "ALL",
  ADMINS = "ADMINS",
  VENDORS = "VENDORS",
  CUSTOMERS = "CUSTOMERS",
  STAFF = "STAFF"
}

export enum KeycardType {
  PHYSICAL = "PHYSICAL",
  VIRTUAL = "VIRTUAL"
}

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM"
} 