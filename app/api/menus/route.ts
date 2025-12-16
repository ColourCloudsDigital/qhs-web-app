import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { UserRole } from '@/lib/types/enums';

// GET /api/menus - Get menus for a hotel
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Get menus
    const result = await menuService.getMenus(hotelId, { page, limit, search });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/menus:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/menus - Create a new menu
export async function POST(req: NextRequest) {
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

    // Get request body
    const body = await req.json();
    const { hotelId, name, description, categories } = body;

    // Validate required fields
    if (!hotelId || !name || !categories) {
      return NextResponse.json(
        { error: 'Hotel ID, name, and categories are required' },
        { status: 400 }
      );
    }

    // Create menu
    const menu = await menuService.createMenu({
      hotelId,
      name,
      description,
      categories,
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/menus:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}