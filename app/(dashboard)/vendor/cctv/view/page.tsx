import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CameraViewClient from '../components/CameraViewClient';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import pool from '@/lib/db';

export const metadata: Metadata = {
  title: 'Camera View | Qaras Hotels',
  description: 'View your hotel security cameras',
};

interface PageProps {
  searchParams: {
    cameraId?: string;
    hotelId?: string;
  };
}

export default async function CameraViewPage({ searchParams }: PageProps) {
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

  const { cameraId, hotelId } = searchParams;
  
  // If we have a cameraId, fetch that specific camera
  let camera = null;
  if (cameraId) {
    camera = await prisma.camera.findUnique({
      where: { id: cameraId },
    });
    
    if (!camera) {
      redirect('/dashboard/vendor/cctv?error=camera-not-found');
    }
    
    // Verify camera belongs to one of the vendor's hotels
    const hotel = await prisma.hotel.findUnique({
      where: {
        id: camera.hotelId,
        vendorId: vendor.id,
      },
    });
    
    if (!hotel) {
      redirect('/dashboard/vendor/cctv?error=unauthorized');
    }
  }

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
  
  // If we have a hotelId, verify it belongs to the vendor
  let selectedHotelId = hotelId;
  if (selectedHotelId) {
    const hotel = hotels.find(h => h.id === selectedHotelId);
    if (!hotel) {
      selectedHotelId = hotels[0]?.id;
    }
  } else if (camera) {
    // If we have a camera but no hotelId, use the camera's hotelId
    selectedHotelId = camera.hotelId;
  } else {
    // Otherwise use the first hotel
    selectedHotelId = hotels[0]?.id;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Live Camera View</h1>
      
      <CameraViewClient 
        userId={session.user.id}
        hotels={hotels}
        initialHotelId={selectedHotelId}
        initialCameraId={cameraId}
        initialCamera={camera}
      />
    </div>
  );
}