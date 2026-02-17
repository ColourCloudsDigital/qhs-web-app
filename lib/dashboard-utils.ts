import { UserRole } from '@/lib/types/enums';
import type { ComponentType } from 'react';

// Define icon types
type IconType = ComponentType<{ className?: string }>;

// Interface for menu items
export interface MenuItem {
  title: string;
  path: string;
  iconName: string;
  children?: MenuItem[];
  expandable?: boolean;
}

/**
 * Returns the appropriate dashboard path based on user role
 */
export function getDashboardPath(role?: string, isImpersonating: boolean = false) {
  // If a super admin is impersonating, we need to redirect to the correct dashboard
  if (role === UserRole.SUPER_ADMIN && isImpersonating) {
    // During impersonation, redirect to vendor dashboard
    return '/vendor/dashboard';
  }

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/admin/dashboard';
    case UserRole.VENDOR:
      return '/vendor/dashboard';
    case UserRole.CUSTOMER:
      return '/customer/dashboard';
    case UserRole.STAFF:
      return '/staff/dashboard';
    default:
      return '/';
  }
}

/**
 * Returns staff menu items based on permissions
 * This function should be called with the staff's permissions array
 */
export function getStaffMenuItems(permissions: string[] = []): MenuItem[] {
  const menuItems: MenuItem[] = [];

  // Dashboard is always available
  menuItems.push({
    title: 'Dashboard',
    path: '/staff/dashboard',
    iconName: 'ChartBarIcon'
  });

  // Tasks permission
  if (permissions.includes('tasks')) {
    menuItems.push({
      title: 'My Tasks',
      path: '/staff/tasks',
      iconName: 'WrenchScrewdriverIcon',
      expandable: true,
      children: [
        {
          title: 'All Tasks',
          path: '/staff/tasks',
          iconName: 'ClipboardDocumentListIcon'
        }
      ]
    });
  }

  // Bookings permission
  if (permissions.includes('bookings')) {
    menuItems.push({
      title: 'Bookings',
      path: '/staff/bookings',
      iconName: 'CalendarIcon',
      expandable: true,
      children: [
        {
          title: 'All Bookings',
          path: '/staff/bookings',
          iconName: 'CalendarIcon'
        },
        {
          title: 'New Booking',
          path: '/staff/bookings/new',
          iconName: 'PlusCircleIcon'
        }
      ]
    });
  }

  // Rooms permission
  if (permissions.includes('rooms')) {
    menuItems.push({
      title: 'Rooms',
      path: '/staff/rooms',
      iconName: 'BuildingOfficeIcon'
    });
  }

  // Customers permission
  if (permissions.includes('customers')) {
    menuItems.push({
      title: 'Customers',
      path: '/staff/customers',
      iconName: 'UserGroupIcon'
    });
  }

  // Payments permission
  if (permissions.includes('payments')) {
    menuItems.push({
      title: 'Payments',
      path: '/staff/payments',
      iconName: 'CreditCardIcon',
      expandable: true,
      children: [
        {
          title: 'All Payments',
          path: '/staff/payments',
          iconName: 'CreditCardIcon'
        },
        {
          title: 'Process Payment',
          path: '/staff/payments/new',
          iconName: 'PlusCircleIcon'
        }
      ]
    });
  }

  // Reports permission
  if (permissions.includes('reports')) {
    menuItems.push({
      title: 'Reports',
      path: '/staff/reports',
      iconName: 'ChartBarIcon',
      expandable: true,
      children: [
        {
          title: 'Booking Reports',
          path: '/staff/reports/bookings',
          iconName: 'CalendarIcon'
        },
        {
          title: 'Revenue Reports',
          path: '/staff/reports/revenue',
          iconName: 'CreditCardIcon'
        },
        {
          title: 'Occupancy Reports',
          path: '/staff/reports/occupancy',
          iconName: 'BuildingOfficeIcon'
        }
      ]
    });
  }

  // Staff permission (for managing other staff)
  if (permissions.includes('staff')) {
    menuItems.push({
      title: 'Staff Management',
      path: '/staff/staff-management',
      iconName: 'UserGroupIcon'
    });
  }

  // Notifications are always available for staff
  menuItems.push({
    title: 'Notifications',
    path: '/staff/notifications',
    iconName: 'BellIcon'
  });

  // Settings permission
  if (permissions.includes('settings')) {
    menuItems.push({
      title: 'Settings',
      path: '/staff/settings',
      iconName: 'Cog6ToothIcon',
      expandable: true,
      children: [
        {
          title: 'General',
          path: '/staff/settings',
          iconName: 'Cog6ToothIcon'
        },
        {
          title: 'Hotel Settings',
          path: '/staff/settings/hotel',
          iconName: 'BuildingOfficeIcon'
        },
        {
          title: 'Notifications',
          path: '/staff/settings/notifications',
          iconName: 'BellIcon'
        }
      ]
    });
  }

  // Profile is always available
  menuItems.push({
    title: 'My Profile',
    path: '/staff/profile',
    iconName: 'UserGroupIcon'
  });

  return menuItems;
}

/**
 * Returns menu items based on the user role and subscription plan
 * For vendors, we only show modules they have access to based on their plan
 * For staff, we filter based on their permissions
 */
export function getMenuItems(role?: UserRole, modules: string[] = [], permissions: string[] = []): MenuItem[] {
  // Always show these items for vendors regardless of plan
  const baseVendorModules = ['dashboard', 'hotels', 'bookings', 'subscription'];
  
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        { 
          title: 'Dashboard', 
          path: '/admin/dashboard', 
          iconName: 'ChartBarIcon'
        },
        { 
          title: 'Users', 
          path: '/admin/users', 
          iconName: 'UserGroupIcon'
        },
        { 
          title: 'Hotels', 
          path: '/admin/hotels', 
          iconName: 'BuildingOfficeIcon'
        },
        { 
          title: 'Subscription Plans', 
          path: '/admin/subscriptions', 
          iconName: 'CubeIcon',
          expandable: true,
          children: [
            {
              title: 'All Plans',
              path: '/admin/subscription-plans',
              iconName: 'CubeIcon'
            },
            {
              title: 'Create Plan',
              path: '/admin/subscription-plans/new',
              iconName: 'PlusCircleIcon'
            }
          ]
        },
        { 
          title: 'Payments', 
          path: '/admin/payments', 
          iconName: 'CreditCardIcon'
        },
        { 
          title: 'Notifications', 
          path: '/admin/notifications', 
          iconName: 'BellIcon',
          expandable: true,
          children: [
            {
              title: 'All Notifications',
              path: '/admin/notifications',
              iconName: 'BellIcon'
            },
            {
              title: 'Settings',
              path: '/admin/notifications/settings',
              iconName: 'Cog6ToothIcon'
            },
            {
              title: 'Send Notifications',
              path: '/admin/notifications/send',
              iconName: 'SendIcon'
            },
            {
              title: 'Push Setup',
              path: '/admin/notifications/pwa-setup',
              iconName: 'BellRingIcon'
            }
          ]
        },
        { 
          title: 'Settings', 
          path: '/admin/settings', 
          iconName: 'Cog6ToothIcon',
          expandable: true,
          children: [
            {
              title: 'General',
              path: '/admin/settings/general',
              iconName: 'Cog6ToothIcon'
            },
            {
              title: 'Email',
              path: '/admin/settings/email',
              iconName: 'EnvelopeIcon'
            },
            {
              title: 'Payment',
              path: '/admin/settings/payment',
              iconName: 'CreditCardIcon'
            },
            {
              title: 'SEO',
              path: '/admin/settings/seo',
              iconName: 'MagnifyingGlassIcon'
            },
            {
              title: 'Cookies',
              path: '/admin/settings/cookies',
              iconName: 'CookieIcon'
            },
            {
              title: 'Security',
              path: '/admin/settings/security',
              iconName: 'ShieldCheckIcon'
            },
            {
              title: 'Analytics',
              path: '/admin/settings/analytics',
              iconName: 'ChartBarIcon'
            },
            {
              title: 'Theme',
              path: '/admin/settings/theme',
              iconName: 'PaintBrushIcon'
            },
            {
              title: 'Legal',
              path: '/admin/settings/legal',
              iconName: 'DocumentTextIcon'
            }
          ]
        },
      ];
      
    case UserRole.VENDOR:
      // Start with the base modules that all vendors get
      const vendorItems = [
        { 
          title: 'Dashboard', 
          path: '/vendor/dashboard', 
          iconName: 'ChartBarIcon'
        },
        { 
          title: 'Bookings', 
          path: '/vendor/bookings', 
          iconName: 'CalendarIcon',
          expandable: true,
          children: [
            {
              title: 'All Bookings',
              path: '/vendor/bookings',
              iconName: 'CalendarIcon'
            }
          ]
        },
        { 
          title: 'My Hotels', 
          path: '/vendor/hotels', 
          iconName: 'BuildingOfficeIcon',
        },
        { 
          title: 'Subscription', 
          path: '/vendor/subscription', 
          iconName: 'CreditCardIcon',
          expandable: true,
          children: [
            {
              title: 'My Plan',
              path: '/vendor/subscription',
              iconName: 'DocumentTextIcon'
            },
            {
              title: 'Upgrade',
              path: '/vendor/subscription/upgrade',
              iconName: 'ArrowTrendingUpIcon'
            }
          ]
        },
        { 
          title: 'My Profile', 
          path: '/vendor/profile', 
          iconName: 'UserGroupIcon'
        }
      ];
      
      // Add addon modules based on subscription plan
      
      if (modules.includes('MENU') || modules.includes('QR_MENU') || modules.includes('menu')) {
        vendorItems.push({ 
          title: 'Menus', 
          path: '/vendor/menus', 
          iconName: 'QrCodeIcon',
          expandable: true,
          children: [
            {
              title: 'All Menus',
              path: '/vendor/menus',
              iconName: 'ClipboardDocumentListIcon'
            }
          ]
        });
      }
      
      if (modules.includes('MAINTENANCE') || modules.includes('FACILITY_MANAGEMENT') || modules.includes('facility')) {
        vendorItems.push({ 
          title: 'Facility Management', 
          path: '/vendor/facility', 
          iconName: 'WrenchScrewdriverIcon',
          expandable: true,
          children: [
            {
              title: 'Dashboard',
              path: '/vendor/facility',
              iconName: 'HomeIcon'
            },
            {
              title: 'Tasks',
              path: '/vendor/facility/tasks',
              iconName: 'ClipboardDocumentCheckIcon'
            },
            {
              title: 'Staff & Roles',
              path: '/vendor/facility/staff-roles',
              iconName: 'UserGroupIcon'
            }
          ]
        });
      }
      
      // Always add notifications for all vendors
      vendorItems.push({ 
        title: 'Notifications', 
        path: '/vendor/notifications', 
        iconName: 'BellIcon',
        expandable: true,
        children: [
          {
            title: 'All Notifications',
            path: '/vendor/notifications',
            iconName: 'BellIcon'
          },
          {
            title: 'Settings',
            path: '/vendor/notifications/settings',
            iconName: 'Cog6ToothIcon'
          }
        ]
      });
      
      // Always add settings for vendors
      vendorItems.push({
        title: 'Settings',
        path: '/vendor/settings',
        iconName: 'Cog6ToothIcon',
        expandable: true,
        children: [
          {
            title: 'General',
            path: '/vendor/settings/general',
            iconName: 'Cog6ToothIcon'
          },
          {
            title: 'Security',
            path: '/vendor/settings/security',
            iconName: 'ShieldCheckIcon'
          },
          {
            title: 'Notifications',
            path: '/vendor/settings/notifications',
            iconName: 'BellIcon'
          },
          {
            title: 'PWA & Offline',
            path: '/vendor/settings/pwa-setup',
            iconName: 'WifiIcon'
          }
        ]
      });
      
      return vendorItems;
      
    case UserRole.CUSTOMER:
          return [
            { 
              title: 'Dashboard', 
              path: '/customer/dashboard', 
              iconName: 'ChartBarIcon'
            },
            { 
              title: 'My Bookings', 
              path: '/customer/bookings', 
              iconName: 'CalendarIcon'
            },
            { 
              title: 'Favorites', 
              path: '/customer/favorites', 
              iconName: 'HeartIcon'
            },
            { 
              title: 'Notifications', 
              path: '/customer/notifications', 
              iconName: 'BellIcon',
              expandable: true,
              children: [
                {
                  title: 'All Notifications',
                  path: '/customer/notifications',
                  iconName: 'BellIcon'
                },
                {
                  title: 'Settings',
                  path: '/customer/notifications/settings',
                  iconName: 'Cog6ToothIcon'
                },
              ]
            },
            { 
              title: 'Settings', 
              path: '/customer/settings', 
              iconName: 'Cog6ToothIcon'
            },
          ];
      
    case UserRole.STAFF:
      return getStaffMenuItems(permissions);
      
    default:
      return [];
  }
}

/**
 * Returns the appropriate profile page path based on user role.
 * If impersonating, it should return the profile path for the impersonated user's role.
 */
export function getProfilePath(role?: string, isImpersonating: boolean = false, impersonatedRole?: string) {
  // Unified profile page path
  return '/dashboard/profile';
}

/**
 * Returns the logo path based on user role and theme
 */
export function getLogoBySite(role?: UserRole, isDarkMode: boolean = false, collapsed: boolean = false): string {
  // Default logo paths
  const defaultCollapsedLogo = '/images/logo.svg';
  const defaultLightLogo = '/assets/images/logo-dark.svg';
  const defaultDarkLogo = '/assets/images/logo-light.svg';
  
  // Use collapsed logo for collapsed sidebar
  if (collapsed) {
    return defaultCollapsedLogo;
  }
  
  // Use theme-specific logo for expanded sidebar
  return isDarkMode ? defaultDarkLogo : defaultLightLogo;
}

/**
 * Returns the avatar path for the user
 */
export function getUserAvatar(role?: string) {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/assets/images/placeholder-avatar.jpg';
    case UserRole.VENDOR:
      return '/assets/images/placeholder-avatar.jpg';
    case UserRole.CUSTOMER:
      return '/assets/images/placeholder-avatar.jpg';
    case UserRole.STAFF:
      return '/assets/images/placeholder-avatar.jpg';
    default:
      return '/assets/images/placeholder-avatar.jpg';
  }
}