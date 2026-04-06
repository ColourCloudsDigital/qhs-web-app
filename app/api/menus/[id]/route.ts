import { NextRequest, NextResponse } from 'next/server';
import menuService from '@/lib/services/menu.service';

// Get the public menu for a hotel
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Log the access for analytics (non-critical)
    try {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      const referrer = req.headers.get('referer') || 'unknown';
      await menuService.logMenuAccess(id, ip as string, userAgent as string, referrer as string);
    } catch (logError) {
      console.error('[API] Error logging menu access (non-critical):', logError);
    }
    
    // Get the full menu data
    const menuData = await menuService.getFullMenu(id);
    
    return NextResponse.json(menuData);
  } catch (error: any) {
    console.error('[API] Error getting public menu:', error);
    return NextResponse.json({ error: error.message || 'Failed to get menu' }, { status: 500 });
  }
} 