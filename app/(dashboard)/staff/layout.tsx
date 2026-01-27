'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StaffSidebar from '@/components/dashboard/StaffSidebar';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import { HotelProvider } from '@/contexts/HotelContext';
import { StaffPermissionsProvider } from '@/contexts/StaffPermissionsContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { UserRole } from '@/lib/types/enums';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { impersonation } = useImpersonation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Check if user is authorized
  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = session?.user?.role;
      const allowedRoles = [UserRole.STAFF, UserRole.SUPER_ADMIN];
      
      // Always allow SUPER_ADMIN to access any page when impersonating
      const isSuperAdminImpersonating = userRole === UserRole.SUPER_ADMIN && impersonation.isImpersonating;
      
      if (!isSuperAdminImpersonating && !allowedRoles.includes(userRole)) {
        router.push('/unauthorized');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/staff');
    }
  }, [status, session, router, impersonation.isImpersonating]);

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Check if user has required role
  const userRole = session?.user?.role;
  const allowedRoles = [UserRole.STAFF, UserRole.SUPER_ADMIN];
  
  // Always allow SUPER_ADMIN to access any page when impersonating
  const isSuperAdminImpersonating = userRole === UserRole.SUPER_ADMIN && impersonation.isImpersonating;
  
  if (userRole && !isSuperAdminImpersonating && !allowedRoles.includes(userRole)) {
    return null;
  }

  return (
    <HotelProvider>
      <StaffPermissionsProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <StaffSidebar 
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
              toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              collapsed={sidebarCollapsed}
            />
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </StaffPermissionsProvider>
    </HotelProvider>
  );
}