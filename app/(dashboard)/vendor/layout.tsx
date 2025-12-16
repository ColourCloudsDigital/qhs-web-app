'use client';

import { UserRole } from '@/lib/types/enums';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  // Allow both VENDOR and SUPER_ADMIN roles to access this layout
  return (
    <DashboardLayout 
      requireRole={[UserRole.VENDOR, UserRole.SUPER_ADMIN]} 
      redirectPath="/login?callbackUrl=/vendor"
    >
      {children}
    </DashboardLayout>
  );
}