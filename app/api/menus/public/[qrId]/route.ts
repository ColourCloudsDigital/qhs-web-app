import { NextRequest, NextResponse } from 'next/server';
import menuService from '@/lib/services/menu.service';

// GET /api/menus/public/[id] - Get a menu by QR code ID (public endpoint)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get menu
    const menu = await menuService.getMenuByQrId(params.id);

    // Check if menu is active
    if (!menu.isActive) {
      return NextResponse.json({ error: 'This menu is not currently active' }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error(`Error in GET /api/menus/public/${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}