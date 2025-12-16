'use client';

import { UserRole } from '@/lib/types/enums';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout 
      requireRole={UserRole.CUSTOMER} 
      redirectPath="/login?callbackUrl=/customer"
    >
      {children}
    </DashboardLayout>
  );
}