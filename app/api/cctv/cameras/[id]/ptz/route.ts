import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cctvService } from '@/lib/services/cctv.service';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';
import pool from '@/lib/db';

interface Params {
  params: {
    id: string;
  };
}

/**
 * POST /api/cctv/cameras/[id]/ptz
 * Send PTZ command to camera
 */
export async function POST(req: NextRequest, { params }: Params) {
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
    const data = await req.json();
    const { command, ...commandParams } = data;

    // Get the camera to verify it exists and supports PTZ
    const camera = await prisma.camera.findUnique({
      where: { id },
    });

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    if (!camera.ptzEnabled) {
      return NextResponse.json({ error: 'Camera does not support PTZ' }, { status: 400 });
    }

    // Log the access
    await cctvService.logCameraAccess({
      cameraId: id,
      userId: session.user.id,
      action: `PTZ_${command.toUpperCase()}`,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    // In a real implementation, we would:
    // 1. Use the camera's API (ONVIF, manufacturer SDK, etc.) to send the command
    // 2. Handle errors from the camera
    // 3. Return the result
    
    // For this example, we'll simulate a successful command
    // In production, you'd integrate with the actual camera API
    
    // Validate the command
    const validCommands = ['up', 'down', 'left', 'right', 'zoomin', 'zoomout', 'home', 'preset', 'savePreset'];
    if (!validCommands.includes(command)) {
      return NextResponse.json({ error: 'Invalid PTZ command' }, { status: 400 });
    }

    // Simulate some validation for preset commands
    if (command === 'preset' || command === 'savePreset') {
      if (!commandParams.preset || typeof commandParams.preset !== 'number') {
        return NextResponse.json({ error: 'Preset number is required' }, { status: 400 });
      }
      
      if (commandParams.preset < 1 || commandParams.preset > 255) {
        return NextResponse.json({ error: 'Preset number must be between 1 and 255' }, { status: 400 });
      }
    }

    // In a real implementation, we would have camera-specific code here to:
    // 1. Establish connection to the camera
    // 2. Send the appropriate command
    // 3. Handle the response
    
    // For now, we'll just simulate a successful response
    return NextResponse.json({ 
      success: true,
      message: `PTZ command ${command} processed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('PTZ error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}