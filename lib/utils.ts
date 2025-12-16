import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a currency string with the appropriate currency symbol
 */
export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string into a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculate the percentage change between two numbers
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  return ((current - previous) / previous) * 100;
}

/**
 * Truncate a string to the specified length and add ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Generate a random hex color
 */
export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * Check if object is empty
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Convert a string to title case
 */
export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Nigerian number
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 13 && cleaned.startsWith('234')) {
    // Handle international format (+234)
    return '+' + cleaned.replace(/(\d{3})(\d{4})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }
  
  // If not a standard format, return as is
  return phoneNumber;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Delay execution (sleep)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // For weekly: 0=Sunday, 6=Saturday
  dayOfMonth?: number; // For monthly
  monthOfYear?: number; // For yearly
}

/**
 * Calculate the next occurrence date based on a recurring pattern
 */
export function calculateNextOccurrence(
  baseDate: Date,
  pattern: RecurringPattern
): Date {
  const result = new Date(baseDate);
  
  switch (pattern.frequency) {
    case 'daily':
      result.setDate(result.getDate() + pattern.interval);
      break;
      
    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        // Get the current day of the week (0-6)
        const currentDayOfWeek = baseDate.getDay();
        
        // Find the next day of the week that matches the pattern
        let nextDay = null;
        let daysToAdd = 0;
        
        // Sort days of week to make sure we find the next occurrence
        const sortedDays = [...pattern.daysOfWeek].sort((a, b) => a - b);
        
        // First look for a day later in the current week
        for (const day of sortedDays) {
          if (day > currentDayOfWeek) {
            nextDay = day;
            daysToAdd = day - currentDayOfWeek;
            break;
          }
        }
        
        // If no day found, use the first day in the next week
        if (nextDay === null) {
          nextDay = sortedDays[0];
          daysToAdd = 7 - currentDayOfWeek + nextDay;
        }
        
        // Add the days
        result.setDate(result.getDate() + daysToAdd);
      } else {
        // Default to adding weeks if no specific days provided
        result.setDate(result.getDate() + (7 * pattern.interval));
      }
      break;
      
    case 'monthly':
      // If a specific day of month is provided, use it
      if (pattern.dayOfMonth) {
        result.setMonth(result.getMonth() + pattern.interval);
        
        // Set to the specified day of the month
        // Check if valid day for the month (e.g., no Feb 31)
        const maxDays = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
        result.setDate(Math.min(pattern.dayOfMonth, maxDays));
      } else {
        // If no specific day provided, just add months
        result.setMonth(result.getMonth() + pattern.interval);
      }
      break;
      
    case 'yearly':
      // Add years
      result.setFullYear(result.getFullYear() + pattern.interval);
      
      // If month of year is specified, use it
      if (pattern.monthOfYear !== undefined) {
        // monthOfYear should be 0-11 where 0 is January
        result.setMonth(pattern.monthOfYear);
      }
      
      // If day of month is also specified
      if (pattern.dayOfMonth) {
        // Check if valid day for the month
        const maxDays = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
        result.setDate(Math.min(pattern.dayOfMonth, maxDays));
      }
      break;
  }
  
  return result;
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Calculate the number of nights between two dates
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
} 