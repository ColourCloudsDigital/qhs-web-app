import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { getUserVendorId } from '@/lib/utils/vendor';
import { HotelService } from '@/services/hotels';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Vendor Dashboard',
  description: 'Manage user roles and permissions for your facility',
};

export const dynamic = 'force-dynamic';

// Dynamically load TabsClient (client-only)
const TabsClient = dynamicImport(() => import('../components/TabsClient'), { ssr: false });

export default async function UserRolesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Get vendor id
  const { vendorId } = await getUserVendorId(session);
  if (!vendorId) {
    redirect('/login');
  }

  let hotels: { id: string; name: string }[] = [];
  try {
    const result = await HotelService.getHotels({
      filters: { vendorId },
      simple: true,
    });
    hotels = (result.hotels as any[]).map((h: any) => ({ id: h.id, name: h.name }));
  } catch (err) {
    console.error('Failed to fetch hotels for staff-roles page:', err);
  }

  if (hotels.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Staff & Roles</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p>You need to add a hotel before you can manage staff and roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff & Roles Management</h1>
      <TabsClient hotels={hotels} vendorId={vendorId} />
    </div>
  );
}
