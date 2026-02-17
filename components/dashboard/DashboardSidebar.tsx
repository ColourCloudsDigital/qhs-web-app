'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { UserRole } from '@/lib/types/enums';
import { 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CubeIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  BellIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import { Cookie, PlusCircleIcon } from 'lucide-react';
import { getMenuItems, getLogoBySite } from '@/lib/dashboard-utils';

type DashboardSidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  collapsed?: boolean;
  isDarkMode?: boolean;
};

// Map icon names to components
const iconComponents = {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CubeIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  BellIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  Cookie,
  PlusCircleIcon,
  QrCodeIcon,
};

const DashboardSidebar = ({ 
  isOpen, 
  setIsOpen, 
  collapsed = false,
  isDarkMode = false 
}: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { impersonation } = useImpersonation();
  const userRole = session?.user?.role;
  const [modules, setModules] = useState<string[]>([]);
  
  // Get the effective role - if super admin is impersonating a vendor, show vendor menu
  const effectiveRole = useMemo(() => {
    // Log impersonation state for debugging
    console.log('[DashboardSidebar] User role:', userRole);
    console.log('[DashboardSidebar] Impersonation state:', impersonation);
    
    if (impersonation.isImpersonating) {
      // If we have a specific role being impersonated, use that
      if (impersonation.userRole) {
        console.log(`[DashboardSidebar] Using impersonated role: ${impersonation.userRole}`);
        return impersonation.userRole;
      }
      
      // Default to VENDOR if impersonating but no specific role
      if (userRole === UserRole.SUPER_ADMIN) {
        console.log('[DashboardSidebar] Admin is impersonating - switching to VENDOR view');
        return UserRole.VENDOR;
      }
    }
    
    console.log('[DashboardSidebar] Using actual role:', userRole);
    return userRole;
  }, [userRole, impersonation.isImpersonating, impersonation.userRole]);
  
  // Fetch available modules for the vendor's subscription plan if the user is a vendor
  useEffect(() => {
    if ((effectiveRole === UserRole.VENDOR) && session?.user) {
      // For the Premium subscription plan, include all modules
      // In a real implementation, we would fetch these from the API
      setModules([
        'QR_MENU', 'FACILITY_MANAGEMENT', 
        'ANALYTICS', 'POS'
      ]);
      
      // Uncomment this section to fetch the modules from the API when ready
      /*
      const fetchVendorModules = async () => {
        try {
          const response = await fetch('/api/vendor/subscription/modules');
          if (response.ok) {
            const data = await response.json();
            setModules(data.modules || []);
          }
        } catch (error) {
          console.error('Error fetching vendor modules:', error);
        }
      };
      
      fetchVendorModules();
      */
    }
  }, [effectiveRole, session]);
  
  // Get menu items based on effective role and modules
  const menuItems = useMemo(() => {
    if (effectiveRole === UserRole.STAFF) {
      // For staff, we need to get permissions from context
      // This will be handled by the StaffSidebar component
      return [];
    }
    return getMenuItems(effectiveRole, modules);
  }, [effectiveRole, modules]);
  
  // Get logo based on effective role and theme
  const logoPath = useMemo(() => getLogoBySite(effectiveRole, isDarkMode), [effectiveRole, isDarkMode]);
  
  // Get dashboard path based on effective role
  const dashboardPath = useMemo(() => {
    const baseItem = menuItems.find(item => item.title === 'Dashboard');
    return baseItem?.path || '/dashboard';
  }, [menuItems]);
  
  // Track expanded menu sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Auto-expand sections when navigating to their children
  useEffect(() => {
    if (!pathname) return;
    
    menuItems.forEach(item => {
      if (item.children && 
          item.children.some(child => pathname === child.path || pathname.startsWith(child.path + '/'))) {
        setExpandedSections(prev => ({...prev, [item.path]: true}));
      }
    });
  }, [pathname, menuItems]);

  // Render icon by name
  const renderIcon = (iconName: string) => {
    const IconComponent = iconComponents[iconName as keyof typeof iconComponents];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black opacity-50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col bg-white dark:bg-gray-800 border dark:border-gray-700 border-r-gray-200 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          collapsed ? 'w-20' : 'w-64'
        } lg:fixed lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} p-4`}>
            <Link href={dashboardPath} className="flex items-center">
              <Image
                src={logoPath}
                alt="Qaras Hotels"
                width={collapsed ? 40 : 120}
                height={40}
                className="h-10"
                priority
              />
            </Link>
            {!collapsed && (
              <button 
                className="text-slate-800 hover:text-primary lg:hidden dark:text-white"
                onClick={() => setIsOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
          
          {/* Navigation */}
          <nav className={`${collapsed ? 'mt-5' : 'mt-5'} flex-1 space-y-1 overflow-y-auto px-2`}>
            {menuItems.map((item) => {
              const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
              const isExpanded = expandedSections[item.path];
              
              // Handle items with children (expandable)
              if (item.expandable && item.children && item.children.length > 0) {
                return (
                  <div key={item.path} className="space-y-1 mb-2">
                    {/* Main menu item with dropdown */}
                    <button
                      onClick={() => setExpandedSections(prev => ({...prev, [item.path]: !prev[item.path]}))}
                      className={`group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary bg-opacity-10 text-primary dark:bg-primary dark:bg-opacity-20 dark:text-primary-light' 
                          : 'text-slate-800 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`${collapsed ? "mx-auto" : "mr-3"} ${isActive ? 'text-primary dark:text-primary-light' : ''}`}>
                          {renderIcon(item.iconName)}
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDownIcon 
                          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      )}
                      {collapsed && (
                        <span className="absolute left-full ml-6 -translate-x-3 rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:translate-x-0 group-hover:opacity-100 z-50">
                          {item.title}
                        </span>
                      )}
                    </button>
                    
                    {/* Child items */}
                    {!collapsed && isExpanded && (
                      <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                        {item.children.map(child => {
                          const isChildActive = pathname === child.path || pathname?.startsWith(`${child.path}/`);
                          
                          // Skip the first child if its path is the same as parent
                          if (child.path === item.path && child.title === 'All Notifications') {
                            return (
                              <Link 
                                key={child.path}
                                href={child.path}
                                className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                                  pathname === child.path 
                                    ? 'bg-gray-100 text-primary font-medium dark:bg-gray-800 dark:text-primary-light' 
                                    : 'text-slate-700 hover:bg-gray-50 hover:text-primary dark:text-slate-300 dark:hover:bg-gray-800 dark:hover:text-primary-light'
                                }`}
                              >
                                All Notifications
                              </Link>
                            );
                          }
                          
                          return (
                            <Link 
                              key={child.path}
                              href={child.path}
                              className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                                isChildActive 
                                  ? 'bg-gray-100 text-primary font-medium dark:bg-gray-800 dark:text-primary-light' 
                                  : 'text-slate-700 hover:bg-gray-50 hover:text-primary dark:text-slate-300 dark:hover:bg-gray-800 dark:hover:text-primary-light'
                              }`}
                            >
                              {child.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Standard menu items without children
              return (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium mb-1 transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary bg-opacity-10 text-primary dark:bg-primary dark:bg-opacity-20 dark:text-primary-light' 
                      : 'text-slate-800 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`${collapsed ? "mx-auto" : "mr-3"} ${isActive ? 'text-primary dark:text-primary-light' : ''}`}>
                    {renderIcon(item.iconName)}
                  </span>
                  {!collapsed && <span>{item.title}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-6 -translate-x-3 rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:translate-x-0 group-hover:opacity-100 z-50">
                      {item.title}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Logout button */}
          <div className="border-t border-gray-300 dark:border-gray-700 p-4">
            <Link 
              href="/api/auth/signout"
              className="group flex items-center rounded-md px-3 py-2 text-sm font-medium dark:text-white text-slate-800 hover:bg-gray-700 hover:text-white"
            >
              <ArrowRightOnRectangleIcon className={collapsed ? "mx-auto h-5 w-5" : "mr-3 h-5 w-5"} />
              {!collapsed && <span>Logout</span>}
              {collapsed && (
                <span className="absolute left-full ml-6 -translate-x-3 rounded-md bg-gray-800 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:translate-x-0 group-hover:opacity-100">
                  Logout
                </span>
              )}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;