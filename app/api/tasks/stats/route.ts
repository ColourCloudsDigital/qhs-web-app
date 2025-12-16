import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import TaskService from '@/lib/services/task.service';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check module access
    const hasAccess = await canAccessModule(
      session.user.id,
      ModuleType.FACILITY_MANAGEMENT
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Module access not included in your subscription plan' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Verify hotel access based on user role
    const userRole = session.user.role;
    
    if (userRole === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: session.user.id },
        include: {
          hotels: {
            select: { id: true },
          },
        },
      });
      
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }
      
      const hasHotelAccess = vendor.hotels.some(hotel => hotel.id === hotelId);
      if (!hasHotelAccess) {
        return NextResponse.json({ error: 'Access denied to this hotel' }, { status: 403 });
      }
    } else if (userRole === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
        select: { hotelId: true },
      });
      
      if (!staff) {
        return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
      }
      
      if (staff.hotelId !== hotelId) {
        return NextResponse.json({ error: 'Access denied to this hotel' }, { status: 403 });
      }
    }

    // Get task stats using the task service
    const taskStats = await TaskService.getTaskStats(hotelId);

    return NextResponse.json(taskStats);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}