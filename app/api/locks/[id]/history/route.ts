import { NextRequest, NextResponse } from 'next/server';
import { LockService } from '@/lib/services/lock.service';
import { KeycardService } from '@/lib/services/keycard.service';
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

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const isSuccess = searchParams.has('isSuccess') 
      ? searchParams.get('isSuccess') === 'true' 
      : undefined;
    const startDate = searchParams.has('startDate') 
      ? new Date(searchParams.get('startDate') as string) 
      : undefined;
    const endDate = searchParams.has('endDate') 
      ? new Date(searchParams.get('endDate') as string) 
      : undefined;
    const limit = searchParams.has('limit') 
      ? parseInt(searchParams.get('limit') as string, 10) 
      : 50;
    const offset = searchParams.has('offset') 
      ? parseInt(searchParams.get('offset') as string, 10) 
      : 0;

    // Get lock history
    const result = await LockService.getLockHistory({
      lockId: id,
      isSuccess,
      startDate,
      endDate,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error getting lock history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Verify the lock exists
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

    // Validate required fields
    if (body.isSuccess === undefined) {
      return NextResponse.json({ error: 'Success status is required' }, { status: 400 });
    }
    
    if (!body.accessType) {
      return NextResponse.json({ error: 'Access type is required' }, { status: 400 });
    }

    // Record the lock access
    const result = await KeycardService.recordLockAccess({
      lockId: id,
      keycardId: body.keycardId,
      isSuccess: body.isSuccess,
      accessType: body.accessType,
      entryData: body.entryData
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error recording lock access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}