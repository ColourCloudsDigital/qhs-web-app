import { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import dynamicImport from 'next/dynamic';
import { getUserVendorId } from '@/lib/utils/vendor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Vendor Dashboard',
  description: 'Manage user roles and permissions for your facility',
};

export const dynamic = 'force-dynamic';

// Fetch vendor hotels
async function getVendorHotels() {
  const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join('; ');

  const response = await fetch(`${API_URL}/api/vendor/hotels?simple=true`, {
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch hotels');
    return [];
  }

  const data = await response.json();
  return data.hotels || [];
}

// Dynamically load TabsClient (client-only)
const TabsClient = dynamicImport(() => import('../components/TabsClient'), { ssr: false });

export default async function UserRolesPage() {
  const session = await getServerSession(authOptions);

  console.log('Session:', session);
  if (!session?.user) {
    redirect('/login');
  }

  // Get vendor id
  const { vendorId } = await getUserVendorId(session);
  if (!vendorId) {
    redirect('/login');
  }

  const hotels = await getVendorHotels();

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
