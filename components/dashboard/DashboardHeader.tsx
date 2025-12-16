'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bars3Icon, MoonIcon, SunIcon, BuildingOfficeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';
import NotificationCenter from '@/components/common/NotificationCenter';
import { getUserAvatar, getProfilePath } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';
import { useHotel } from '@/contexts/HotelContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

type DashboardHeaderProps = {
  toggleSidebar: () => void;
  toggleCollapse?: () => void;
  collapsed?: boolean;
};

const DashboardHeader = ({ 
  toggleSidebar, 
  toggleCollapse, 
  collapsed 
}: DashboardHeaderProps) => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [darkMode, setDarkMode] = useState(false);
  const { currentHotel, setCurrentHotel, hotels, loading } = useHotel();
  const { impersonation, endImpersonation } = useImpersonation();
  const [showEndImpersonationModal, setShowEndImpersonationModal] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Get avatar image based on user role
  const avatarPath = getUserAvatar(userRole);

  // Determine the correct profile link
  const profileLink = getProfilePath(
    session?.user?.role as UserRole | undefined, 
    impersonation.isImpersonating,
    impersonation.userRole ? impersonation.userRole : undefined // Pass undefined if null
  );

  // Determine if we should show collapse toggle (admin only)
  const showCollapseToggle = userRole === 'SUPER_ADMIN' && toggleCollapse;
  
  // Determine if we should show hotel selector (vendor or staff only or when impersonating)
  const showHotelSelector = ((userRole === 'VENDOR' || userRole === 'STAFF') && hotels.length > 0) || 
                           (impersonation.isImpersonating && hotels.length > 0);

  // Handle hotel change
  const handleHotelChange = (hotelId: string) => {
    const selectedHotel = hotels.find(hotel => hotel.id === hotelId) || null;
    setCurrentHotel(selectedHotel);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2">
          {/* Mobile menu toggle button */}
          <button
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors duration-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-light lg:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Collapse toggle button - only for admin */}
          {showCollapseToggle && (
            <button
              className="hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors duration-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-light lg:block"
              onClick={toggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          {/* Hotel selector - only for vendor and staff */}
          {showHotelSelector && (
            <div className="ml-2 w-64">
              <Select
                value={currentHotel?.id}
                onValueChange={handleHotelChange}
              >
                <SelectTrigger className="h-9 w-full bg-white border border-gray-200 hover:border-primary focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-light transition-all duration-200">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Select a hotel" />
                  </div>
                </SelectTrigger>
                <SelectContent className="border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* End Impersonation Button - Only show if impersonating */}
          {impersonation.isImpersonating && (
            <button
              onClick={() => setShowEndImpersonationModal(true)}
              className="flex items-center rounded-md bg-amber-100 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900/75"
            >
              <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
              End Impersonation
            </button>
          )}
          
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-light"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {/* Notifications - Uses your existing NotificationCenter component */}
          <NotificationCenter />

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-transparent hover:border-primary transition-all duration-200">
                <Image
                  src={avatarPath}
                  alt="User avatar"
                  fill
                  sizes="50px"
                  className="object-cover"
                />
              </div>
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <Menu.Item>
                  {({ active }) => (
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{session?.user?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</div>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href={profileLink}
                      className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-150 ${
                        active
                          ? 'bg-gray-50 text-primary dark:bg-gray-700 dark:text-primary-light'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href={`/${userRole?.toLowerCase()}/settings`}
                      className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-150 ${
                        active
                          ? 'bg-gray-50 text-primary dark:bg-gray-700 dark:text-primary-light'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/api/auth/signout"
                      className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-150 ${
                        active
                          ? 'bg-gray-50 text-red-600 dark:bg-gray-700 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </Link>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
      
      {/* End Impersonation Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEndImpersonationModal}
        onClose={() => setShowEndImpersonationModal(false)}
        onConfirm={endImpersonation}
        title="End Impersonation"
        message={`Are you sure you want to end impersonation and return to your admin account?`}
        confirmText="End Impersonation"
        cancelText="Cancel"
        confirmButtonClass="bg-amber-600 hover:bg-amber-700 text-white"
      />
    </header>
  );
};

export default DashboardHeader;