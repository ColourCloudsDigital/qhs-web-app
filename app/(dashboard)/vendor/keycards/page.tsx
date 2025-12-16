import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import KeycardDashboardClient from '@/components/dashboard/vendor/keycards/KeycardDashboardClient';

export const metadata = {
  title: 'Keycard Management - Qaras Hotels',
  description: 'Manage RFID keycards for your hotel rooms and staff'
};

export default async function KeycardDashboardPage({
  searchParams
}: {
  searchParams: { 
    hotelId?: string;
    view?: string;
    filter?: string;
    page?: string;
  }
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return redirect('/login');
  }
  
  if (session.user.role !== 'VENDOR' && session.user.role !== 'STAFF' && session.user.role !== 'SUPER_ADMIN') {
    return redirect('/dashboard');
  }
  
  let hotels = [];
  let selectedHotelId = searchParams.hotelId;
  
  // Fetch hotels for the vendor
  if (session.user.role === 'VENDOR') {
    hotels = await prisma.hotel.findMany({
      where: {
        vendorId: session.user.vendor?.id
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // If no hotel ID provided or hotel doesn't belong to vendor, use the first hotel
    if (!selectedHotelId || !hotels.some(hotel => hotel.id === selectedHotelId)) {
      selectedHotelId = hotels.length > 0 ? hotels[0].id : undefined;
    }
  } 
  // For staff, only show their assigned hotel
  else if (session.user.role === 'STAFF') {
    const staffHotel = await prisma.staff.findUnique({
      where: {
        id: session.user.staff?.id
      },
      select: {
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      }
    });
    
    if (staffHotel?.hotel) {
      hotels = [staffHotel.hotel];
      selectedHotelId = staffHotel.hotel.id;
    }
  } 
  // For super admin, show all hotels
  else if (session.user.role === 'SUPER_ADMIN') {
    hotels = await prisma.hotel.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // If no hotel ID provided, use the first hotel
    if (!selectedHotelId && hotels.length > 0) {
      selectedHotelId = hotels[0].id;
    }
  }
  
  // Fetch module access info for the vendor
  let hasKeycardAccess = false;
  
  if (session.user.role === 'VENDOR') {
    const vendorSubscription = await prisma.vendor.findUnique({
      where: {
        id: session.user.vendor?.id
      },
      select: {
        subscriptionPlan: {
          select: {
            planFeatures: {
              where: {
                module: {
                  type: 'KEYCARD'
                }
              },
              select: {
                isIncluded: true,
                limits: true
              }
            }
          }
        }
      }
    });
    
    // Check if the vendor has access to the keycard module
    hasKeycardAccess = vendorSubscription?.subscriptionPlan?.planFeatures.some(
      feature => feature.isIncluded
    ) ?? false;
    
    if (!hasKeycardAccess) {
      return redirect('/dashboard/vendor/subscription/upgrade?module=keycard');
    }
  } else {
    // Staff and super admin always have access
    hasKeycardAccess = true;
  }
  
  // For the selected hotel, fetch some basic stats
  let keycardStats = null;
  if (selectedHotelId) {
    const totalKeycards = await prisma.keycard.count({
      where: {
        hotelId: selectedHotelId
      }
    });
    
    const activeKeycards = await prisma.keycard.count({
      where: {
        hotelId: selectedHotelId,
        isActive: true
      }
    });
    
    const configuredKeycards = await prisma.keycard.count({
      where: {
        hotelId: selectedHotelId,
        isConfigured: true
      }
    });
    
    const assignedKeycards = await prisma.keycard.count({
      where: {
        hotelId: selectedHotelId,
        assignedToId: {
          not: null
        }
      }
    });
    
    keycardStats = {
      totalKeycards,
      activeKeycards,
      configuredKeycards,
      assignedKeycards
    };
  }
  
  // Return the client component with the necessary props
  return (
    <KeycardDashboardClient 
      userRole={session.user.role}
      hotels={hotels} 
      selectedHotelId={selectedHotelId}
      keycardStats={keycardStats}
      initialView={searchParams.view || 'keycards'}
      initialFilter={searchParams.filter}
      initialPage={searchParams.page ? parseInt(searchParams.page) : 1}
    />
  );
}