import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cctvService, CameraUpdateInput } from '@/lib/services/cctv.service';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';

interface Params {
  params: {
    id: string;
  };
}

/**
 * GET /api/cctv/cameras/[id]
 * Get a camera by ID
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
    const camera = await cctvService.getCameraById(id);
    
    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    return NextResponse.json(camera);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/cctv/cameras/[id]
 * Update a camera
 */
export async function PUT(req: NextRequest, { params }: Params) {
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

    const camera = await cctvService.updateCamera({
      id,
      ...data
    } as CameraUpdateInput);

    return NextResponse.json(camera);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/cctv/cameras/[id]
 * Delete a camera
 */
export async function DELETE(req: NextRequest, { params }: Params) {
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
    const success = await cctvService.deleteCamera(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete camera' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}