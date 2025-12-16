import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MultiCameraViewClient from '../components/MultiCameraViewClient';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import pool from '@/lib/db';

export const metadata: Metadata = {
  title: 'Multi-Camera View | Qaras Hotels',
  description: 'View multiple security cameras simultaneously',
};

interface PageProps {
  searchParams: {
    hotelId?: string;
    cameras?: string; // Comma-separated list of camera IDs
  };
}

export default async function MultiCameraViewPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has access to CCTV module
  const hasAccess = await canAccessModule(session.user.id, ModuleType.CCTV);
  if (!hasAccess) {
    redirect('/dashboard?error=module-access');
  }

  // Get the vendor information
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) {
    redirect('/dashboard');
  }

  const { hotelId, cameras: cameraIds } = searchParams;
  
  // Get the vendor's hotels for the dropdown
  const hotels = await prisma.hotel.findMany({
    where: { vendorId: vendor.id },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  
  // If hotelId is provided, verify it belongs to the vendor
  let selectedHotelId = hotelId;
  if (selectedHotelId) {
    const hotel = hotels.find(h => h.id === selectedHotelId);
    if (!hotel) {
      selectedHotelId = hotels[0]?.id;
    }
  } else {
    selectedHotelId = hotels[0]?.id;
  }

  // If camera IDs are provided, verify they exist and belong to the selected hotel
  let selectedCameraIds: string[] = [];
  if (cameraIds) {
    selectedCameraIds = cameraIds.split(',');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Multi-Camera View</h1>
      
      <MultiCameraViewClient 
        userId={session.user.id}
        hotels={hotels}
        initialHotelId={selectedHotelId}
        initialCameraIds={selectedCameraIds}
      />
    </div>
  );
}