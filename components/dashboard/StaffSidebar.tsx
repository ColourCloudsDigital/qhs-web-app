'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useStaffPermissions } from '@/contexts/StaffPermissionsContext';
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
  CheckCircleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Cookie, PlusCircleIcon } from 'lucide-react';
import { getStaffMenuItems, getLogoBySite } from '@/lib/dashboard-utils';

type StaffSidebarProps = {
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
  CheckCircleIcon,
  ClipboardDocumentListIcon,
};

const StaffSidebar = ({ 
  isOpen, 
  setIsOpen, 
  collapsed = false,
  isDarkMode = false 
}: StaffSidebarProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { permissions, loading: permissionsLoading, error: permissionsError } = useStaffPermissions();
  
  // Get menu items based on staff permissions
  const menuItems = useMemo(() => {
    if (permissionsLoading || permissionsError) {
      return [];
    }
    return getStaffMenuItems(permissions);
  }, [permissions, permissionsLoading, permissionsError]);
  
  // Get logo based on staff role and theme
  const logoPath = useMemo(() => getLogoBySite(UserRole.STAFF, isDarkMode), [isDarkMode]);
  
  // Get dashboard path for staff
  const dashboardPath = '/staff/dashboard';
  
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

  // Show loading state while fetching permissions
  if (permissionsLoading) {
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
            {/* Logo */}
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
            </div>
            
            {/* Loading state */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-gray-500">Loading permissions...</p>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Show error state if permissions failed to load
  if (permissionsError) {
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
            {/* Logo */}
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
            </div>
            
            {/* Error state */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-sm text-red-500 mb-2">Failed to load permissions</p>
                <p className="text-xs text-gray-500">{permissionsError}</p>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

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
            {menuItems.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No menu items available</p>
                <p className="text-xs text-gray-400 mt-1">Contact your administrator for permissions</p>
              </div>
            ) : (
              menuItems.map((item) => {
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
              })
            )}
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

export default StaffSidebar;