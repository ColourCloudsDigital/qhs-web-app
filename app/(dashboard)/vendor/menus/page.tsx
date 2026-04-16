import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MenuDashboard from '@/components/menus/MenuDashboard';
import AccessDenied from '@/components/shared/AccessDenied';
import { UserRole, ModuleType } from '@/lib/types/enums';
import { moduleAccessService } from '@/lib/services/module-access.service';
import { getUserVendorId } from '@/lib/utils/vendor';

export const metadata: Metadata = {
  title: 'Menu Management - Qaras Hospitality Solutions',
  description: 'Manage your hotel menus and QR codes',
};

export default async function MenuPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Check for impersonation status - the property exists but isn't in the type definition
  const isImpersonating = Boolean((session.user as any).isImpersonating);
  
  // Allow super admins to always access this feature when impersonating
  if (session.user.role === UserRole.SUPER_ADMIN && isImpersonating) {
    return <MenuDashboard />;
  }

  // For vendors, check module access
  if (session.user.role === UserRole.VENDOR) {
    try {
      // Get vendor id
      const { vendorId } = await getUserVendorId(session);
      if (!vendorId) {
        redirect('/login');
      }

      // Check if vendor has access to MENU module
      let hasAccess = await moduleAccessService.hasModuleAccess(vendorId, ModuleType.MENU);
      
      // If no access with MENU, try with the database name "QR Menu"
      if (!hasAccess) {
        try {
          // Direct database check for "QR Menu" module
          const pool = (await import('@/lib/db')).default;
          const [vendorRows] = await pool.query(
            `SELECT subscriptionPlanId, subscriptionStatus FROM vendors WHERE id = ?`,
            [vendorId]
          ) as [any[], any];

          if (vendorRows.length > 0 && vendorRows[0].subscriptionPlanId && vendorRows[0].subscriptionStatus === 'active') {
            const [planFeatureRows] = await pool.query(
              `SELECT pf.isIncluded 
               FROM plan_features pf
               JOIN modules m ON pf.moduleId = m.id
               WHERE pf.planId = ? AND m.name = ?`,
              [vendorRows[0].subscriptionPlanId, 'QR Menu']
            ) as [any[], any];

            if (planFeatureRows.length > 0) {
              hasAccess = planFeatureRows[0].isIncluded === 1 || planFeatureRows[0].isIncluded === true;
            }
          }
        } catch (dbError) {
          console.error('Error checking QR Menu access directly:', dbError);
        }
      }
      
      if (hasAccess) {
        return <MenuDashboard />;
      }

      // If no access, show access denied
      return (
        <AccessDenied 
          title="QR Menu Access Required" 
          message="This feature is not available on your current subscription plan."
          showUpgrade={true}
          upgradePath="/vendor/subscription/upgrade"
        />
      );
    } catch (error) {
      console.error('Error checking menu access:', error);
      
      // On error, show access denied for security
      return (
        <AccessDenied 
          title="Access Error" 
          message="Unable to verify your subscription. Please try again or contact support."
          showUpgrade={true}
          upgradePath="/vendor/subscription/upgrade"
        />
      );
    }
  }

  // For other roles, deny access
  return (
    <AccessDenied 
      title="Unauthorized Access" 
      message="You don't have permission to access this feature."
      showUpgrade={false}
    />
  );
} 