'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import { getDashboardPath } from '@/lib/dashboard-utils';
import { HotelProvider } from '@/contexts/HotelContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { UserRole } from '@/lib/types/enums';

type DashboardLayoutProps = {
  children: React.ReactNode;
  requireRole?: string | string[];
  redirectPath?: string;
  allowCollapse?: boolean;
};

const DashboardLayout = ({ 
  children, 
  requireRole, 
  redirectPath = '/login',
  allowCollapse = false 
}: DashboardLayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { impersonation } = useImpersonation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Check if user is authorized
  useEffect(() => {
    if (status === 'authenticated') {
      if (requireRole) {
        const userRole = session?.user?.role;
        const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
        
        // Always allow SUPER_ADMIN to access any page when impersonating
        const isSuperAdminImpersonating = userRole === UserRole.SUPER_ADMIN && impersonation.isImpersonating;
        
        if (!isSuperAdminImpersonating && !roles.includes(userRole)) {
          router.push('/unauthorized');
        }
      }
    } else if (status === 'unauthenticated') {
      router.push(`${redirectPath}`);
    }
  }, [status, session, router, requireRole, redirectPath, impersonation.isImpersonating]);

  // Load sidebar collapsed state from localStorage for admin
  useEffect(() => {
    if (allowCollapse) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setSidebarCollapsed(savedState === 'true');
      }
    }
  }, [allowCollapse]);

  // Toggle sidebar collapsed state
  const toggleSidebarCollapse = () => {
    const isDark = false; // Dark mode detection removed

    if (allowCollapse) {
      const newState = !sidebarCollapsed;
      setSidebarCollapsed(newState);
      localStorage.setItem('sidebarCollapsed', String(newState));
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Check if user has required role
  if (requireRole) {
    const userRole = session?.user?.role;
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    
    // Always allow SUPER_ADMIN to access any page when impersonating
    const isSuperAdminImpersonating = userRole === UserRole.SUPER_ADMIN && impersonation.isImpersonating;
    
    if (userRole && !isSuperAdminImpersonating && !roles.includes(userRole)) {
      return null;
    }
  }

  return (
    <HotelProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          collapsed={sidebarCollapsed}
          isDarkMode={darkMode}
        />
        
        <div className="flex flex-1 flex-col ml-0 lg:ml-[var(--sidebar-width)]" style={{ '--sidebar-width': sidebarCollapsed ? '5rem' : '16rem' } as React.CSSProperties}>
          {impersonation.isImpersonating && impersonation.adminName && impersonation.userName && (
            <ImpersonationBanner
              adminName={impersonation.adminName}
              userName={impersonation.userName}
            />
          )}
          <DashboardHeader 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            toggleCollapse={allowCollapse ? toggleSidebarCollapse : undefined}
            collapsed={sidebarCollapsed}
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </HotelProvider>
  );
};

export default DashboardLayout;