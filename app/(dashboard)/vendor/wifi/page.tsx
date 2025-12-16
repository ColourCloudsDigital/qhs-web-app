import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { moduleAccessService } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import PageHeading from '@/components/common/PageHeading';
import WifiDashboard from '@/components/dashboard/vendor/wifi/WifiDashboard';
import { getUserVendorId } from '@/lib/utils/vendor';

export const metadata: Metadata = {
  title: 'WiFi Management | Qaras Hotels',
  description: 'Manage WiFi credentials for your hotels',
};

export default async function WifiPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // Get vendor id
  const { vendorId } = await getUserVendorId(session);
  if (!vendorId) {
    redirect('/login');
  }

  // Check module access
  const hasAccess = await moduleAccessService.hasModuleAccess(vendorId, ModuleType.WIFI);
  if (!hasAccess) {
    return (
      <>
        <PageHeading 
          title="WiFi Management" 
          description="Manage WiFi networks and credentials for your hotels" 
        />
        <div className="mt-6">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Subscription Required
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    The WiFi Management feature is not included in your current subscription plan. 
                    Please upgrade your plan to access this feature.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <a
                      href="/vendor/subscription/upgrade"
                      className="rounded-md bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
                    >
                      Upgrade Plan
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading 
        title="WiFi Management" 
        description="Manage WiFi networks and credentials for your hotels" 
      />
      <div className="mt-6">
        <WifiDashboard vendorId={vendorId} />
      </div>
    </>
  );
} 