import { NextRequest, NextResponse } from 'next/server';
import menuService from '@/lib/services/menu.service';

/**
 * API endpoint to track a menu view
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const { hotelId } = params;
    
    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }
    
    // Get tracking data from request
    let data = {};
    try {
      data = await req.json();
    } catch (e) {
      // If body is empty or invalid, continue with empty data
      console.log('[API] No body provided for menu view tracking');
    }
    
    // Extract user agent and other tracking info
    const userAgent = req.headers.get('user-agent') || (data as any).userAgent || '';
    const referrer = req.headers.get('referer') || (data as any).referrer || '';
    
    // Detect device type
    const device = detectDevice(userAgent);
    
    // Track the view
    await menuService.trackMenuView(hotelId, {
      userAgent,
      referrer,
      device
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error tracking menu view:', error);
    // Always return success to client, even if there's an error
    // This way the user experience isn't affected by tracking errors
    return NextResponse.json({ success: true });
  }
}

/**
 * Helper function to detect device type from user agent
 */
function detectDevice(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  userAgent = userAgent.toLowerCase();
  
  if (!userAgent) return 'unknown';
  
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|webos/i.test(userAgent)) {
    return 'mobile';
  }
  
  if (/macintosh|windows|linux/i.test(userAgent)) {
    return 'desktop';
  }
  
  return 'unknown';
} 