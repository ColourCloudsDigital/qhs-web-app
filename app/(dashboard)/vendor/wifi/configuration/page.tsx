import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { moduleAccessService } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import PageHeading from '@/components/common/PageHeading';
import WifiConfigForm from '@/components/dashboard/vendor/wifi/WifiConfigForm';

export const metadata: Metadata = {
  title: 'WiFi Configuration | Qaras Hotels',
  description: 'Configure WiFi settings for your hotels',
};

export default async function WifiConfigPage() {
  // Get session
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session) {
    redirect('/login');
  }

  // Redirect if not a vendor
  if (session.user.role !== 'VENDOR') {
    redirect('/dashboard');
  }

  // Check if vendor has access to WiFi module
  const hasAccess = await moduleAccessService.hasModuleAccess(
    session.user.vendorId!,
    ModuleType.WIFI
  );

  // Redirect if no access
  if (!hasAccess) {
    redirect('/dashboard/subscription?module=wifi');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeading 
        title="WiFi Configuration" 
        description="Configure WiFi settings for your hotels"
      />
      
      <WifiConfigForm vendorId={session.user.vendorId!} />
    </div>
  );
}