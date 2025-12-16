import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cctvService, CameraCreateInput } from '@/lib/services/cctv.service';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';

/**
 * GET /api/cctv/cameras
 * Get all cameras for a hotel
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to CCTV module
    const hasAccess = await canAccessModule(session.user.id, ModuleType.CCTV);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to the CCTV module' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const hotelId = url.searchParams.get('hotelId');
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 10;

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    const cameras = await cctvService.getCamerasForHotel(hotelId, { page, limit });
    return NextResponse.json(cameras);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/cctv/cameras
 * Create a new camera
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to CCTV module
    const hasAccess = await canAccessModule(session.user.id, ModuleType.CCTV);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to the CCTV module' },
        { status: 403 }
      );
    }

    const data = await req.json();
    
    // Validate required fields
    if (!data.hotelId || !data.name || !data.ipAddress) {
      return NextResponse.json(
        { error: 'Hotel ID, name, and IP address are required' },
        { status: 400 }
      );
    }

    const camera = await cctvService.createCamera(data as CameraCreateInput);
    return NextResponse.json(camera, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}