import { NextRequest, NextResponse } from 'next/server';
import { LockService } from '@/lib/services/lock.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const isActive = searchParams.has('isActive') 
      ? searchParams.get('isActive') === 'true' 
      : undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const limit = searchParams.has('limit') 
      ? parseInt(searchParams.get('limit') as string, 10) 
      : 20;
    const offset = searchParams.has('offset') 
      ? parseInt(searchParams.get('offset') as string, 10) 
      : 0;

    // Check for hotelId if user is a vendor or staff
    if ((session.user.role === 'VENDOR' || session.user.role === 'STAFF') && !hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Get locks
    const result = await LockService.getLocks({
      hotelId,
      roomId,
      isActive,
      searchTerm,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error getting locks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only vendors and super admins can register locks
    if (session.user.role !== 'VENDOR' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }
    
    if (!body.serialNumber) {
      return NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
    }
    
    if (!body.lockModel) {
      return NextResponse.json({ error: 'Lock model is required' }, { status: 400 });
    }

    // Register lock
    const result = await LockService.registerLock({
      hotelId: body.hotelId,
      roomId: body.roomId,
      serialNumber: body.serialNumber,
      lockModel: body.lockModel,
      firmwareVersion: body.firmwareVersion
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error registering lock:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}