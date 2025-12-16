'use client';

import { UserRole } from '@/lib/types/enums';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout 
      requireRole={UserRole.SUPER_ADMIN} 
      redirectPath="/login?callbackUrl=/admin"
      allowCollapse={true}
    >
      {children}
    </DashboardLayout>
  );
}