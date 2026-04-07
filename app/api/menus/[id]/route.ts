import { NextRequest, NextResponse } from 'next/server';
import menuService from '@/lib/services/menu.service';
import pool from '@/lib/db';

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

    // Fetch hotel name to display in the menu header
    let hotelName = '';
    try {
      const [hotelRows] = await pool.query('SELECT name FROM hotels WHERE id = ?', [id]);
      hotelName = (hotelRows as any[])[0]?.name || '';
    } catch { /* non-critical */ }

    return NextResponse.json({ ...menuData, hotelName });
  } catch (error: any) {
    console.error('[API] Error getting public menu:', error);
    return NextResponse.json({ error: error.message || 'Failed to get menu' }, { status: 500 });
  }
} 