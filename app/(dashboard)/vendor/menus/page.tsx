import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MenuDashboard from '@/components/menus/MenuDashboard';
import AccessDenied from '@/components/shared/AccessDenied';
import { UserRole } from '@/lib/types/enums';
import { checkModuleAccess } from '@/lib/utils/auth';

export const metadata: Metadata = {
  title: 'Menu Management - Qaras Hotels',
  description: 'Manage your hotel menus and QR codes',
};

export default async function MenuPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Check if the user has access to the QR Menu module
  const hasAccess = await checkModuleAccess(session, 'QR Menu');
  
  // Check for impersonation status - the property exists but isn't in the type definition
  const isImpersonating = Boolean((session.user as any).isImpersonating);
  
  // Allow super admins to always access this feature when impersonating
  const canAccess = hasAccess || (session.user.role === UserRole.SUPER_ADMIN && isImpersonating);

  return (
    <>
      {canAccess ? (
        <MenuDashboard />
      ) : (
        <AccessDenied 
          title="QR Menu Access Required" 
          message="This feature is not available on your current subscription plan."
          showUpgrade={true}
          upgradePath="/vendor/subscription/upgrade"
        />
      )}
    </>
  );
} 