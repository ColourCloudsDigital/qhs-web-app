import { NextRequest, NextResponse } from 'next/server';
import { LockService } from '@/lib/services/lock.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const lock = await LockService.getLock(id);

    // Check access permissions based on role
    if (session.user.role === 'VENDOR') {
      // Vendors can only access their own hotel's locks
      const vendorId = session.user.vendor?.id;
      if (!vendorId) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: lock.hotelId },
        select: { vendorId: true }
      });

      if (!hotel || hotel.vendorId !== vendorId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'STAFF') {
      // Staff can only access locks from their assigned hotel
      const staffId = session.user.staff?.id;
      if (!staffId) {
        return NextResponse.json({ error: 'Staff profile not found' }, { status: 403 });
      }

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { hotelId: true }
      });

      if (!staff || staff.hotelId !== lock.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(lock);
  } catch (error: any) {
    console.error('Error getting lock:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only vendors and staff can update locks
    if (session.user.role !== 'VENDOR' && session.user.role !== 'STAFF' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    // Get the current lock to check access permissions
    const lock = await LockService.getLock(id);

    // Check permissions
    if (session.user.role === 'VENDOR') {
      const vendorId = session.user.vendor?.id;
      if (!vendorId) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: lock.hotelId },
        select: { vendorId: true }
      });

      if (!hotel || hotel.vendorId !== vendorId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'STAFF') {
      const staffId = session.user.staff?.id;
      if (!staffId) {
        return NextResponse.json({ error: 'Staff profile not found' }, { status: 403 });
      }

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { hotelId: true }
      });

      if (!staff || staff.hotelId !== lock.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Update the lock
    const result = await LockService.updateLock(id, {
      roomId: body.roomId,
      lockModel: body.lockModel,
      firmwareVersion: body.firmwareVersion,
      batteryLevel: body.batteryLevel,
      lastMaintenance: body.lastMaintenance ? new Date(body.lastMaintenance) : undefined,
      isActive: body.isActive
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating lock:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only vendors and super admins can delete locks
    if (session.user.role !== 'VENDOR' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    
    // Get the current lock to check access permissions
    const lock = await LockService.getLock(id);

    // Vendors can only delete their own locks
    if (session.user.role === 'VENDOR') {
      const vendorId = session.user.vendor?.id;
      if (!vendorId) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: lock.hotelId },
        select: { vendorId: true }
      });

      if (!hotel || hotel.vendorId !== vendorId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Set the lock as inactive instead of deleting
    const result = await LockService.updateLock(id, {
      isActive: false
    });
    
    return NextResponse.json({ message: 'Lock deactivated successfully' });
  } catch (error: any) {
    console.error('Error deleting lock:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}