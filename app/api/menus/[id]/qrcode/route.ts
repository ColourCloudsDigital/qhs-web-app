import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { UserRole } from '@/lib/types/enums';

// POST /api/menus/[id]/qrcode - Regenerate QR code for a menu
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is vendor or admin
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Regenerate QR code
    const result = await menuService.regenerateQRCode(params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in POST /api/menus/${params.id}/qrcode:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}