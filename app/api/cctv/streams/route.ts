import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cctvService } from '@/lib/services/cctv.service';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';

interface Params {
  params: {
    id: string;
  };
}

/**
 * GET /api/cctv/streams/[id]
 * Get a camera stream by ID
 * 
 * Note: In a production environment, this would likely return
 * a streaming video or proxy the camera stream. For this example,
 * we'll just return the stream URL.
 */
export async function GET(req: NextRequest, { params }: Params) {
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

    const { id } = params;
    
    // Get the camera to verify it exists and is active
    const camera = await cctvService.getCameraById(id);
    
    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    
    if (!camera.isActive) {
      return NextResponse.json({ error: 'Camera is inactive' }, { status: 403 });
    }

    // Log the access
    await cctvService.logCameraAccess({
      cameraId: id,
      userId: session.user.id,
      action: 'VIEW',
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    // In a real implementation, this endpoint would:
    // 1. Authenticate with the camera
    // 2. Establish a stream connection
    // 3. Transcode the stream if necessary (RTSP → HLS or WebRTC)
    // 4. Return the streaming content

    // For this example, we'll just return the URL
    const streamUrl = await cctvService.getCameraStreamUrl(id);
    
    // Test the connection
    const isConnected = await cctvService.testCameraConnection(id);
    
    if (!isConnected) {
      return NextResponse.json({ error: 'Failed to connect to camera' }, { status: 500 });
    }

    return NextResponse.json({
      id: camera.id,
      name: camera.name,
      streamUrl: streamUrl,
      ptzEnabled: camera.ptzEnabled,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}