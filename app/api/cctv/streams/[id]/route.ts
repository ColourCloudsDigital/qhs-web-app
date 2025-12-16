import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cctvService } from '@/lib/services/cctv.service';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';

/**
 * GET /api/cctv/streams
 * Get active camera streams for a hotel
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

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Get all active cameras for the hotel
    const cameras = await cctvService.getCamerasForHotel(hotelId);
    
    // Build response with stream URLs
    const streams = await Promise.all(
      cameras.data
        .filter(camera => camera.isActive)
        .map(async (camera) => {
          try {
            const streamUrl = await cctvService.getCameraStreamUrl(camera.id);
            return {
              id: camera.id,
              name: camera.name,
              streamUrl,
              location: camera.location,
              lastConnected: camera.lastConnected,
              ptzEnabled: camera.ptzEnabled,
            };
          } catch (error) {
            // If we can't get a stream URL for this camera, skip it
            return null;
          }
        })
    );

    // Filter out any null entries (failed streams)
    const validStreams = streams.filter(stream => stream !== null);

    return NextResponse.json(validStreams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}