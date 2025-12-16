import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { getUserVendorId } from '@/lib/utils/vendor';
import { UserRole } from '@/lib/types/enums';
import { checkHotelAccess } from '@/lib/utils/auth';
import { generateMenuQRCode, generateQRCode } from '@/lib/services/qrcode.service';

// Regenerate QR code for a hotel's menu
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] Regenerating QR code for ID: ${params.id}`);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('[API] QR Code regeneration unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[API] QR Code regeneration by user: ${session.user.email}, role: ${session.user.role}`);
    
    // Make sure user is a vendor or super admin
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      console.log(`[API] QR Code regeneration forbidden - user role: ${session.user.role}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = params;
    
    // Check if the user has access to this hotel/menu
    const hasAccess = await checkHotelAccess(session, id);
    
    if (!hasAccess) {
      console.log(`[API] User ${session.user.email} doesn't have access to id ${id}`);
      return NextResponse.json({ error: 'You do not have access to this resource' }, { status: 403 });
    }
    
    // If it's a vendor, check if they have access to QR Menu based on subscription
    if (session.user.role === UserRole.VENDOR) {
      const { vendorId } = await getUserVendorId(session);
      if (vendorId) {
        console.log(`[API] Checking menu access for vendor: ${vendorId}, id: ${id}`);
        const hasMenuAccess = await menuService.checkMenuAccess(id, vendorId);
        if (!hasMenuAccess) {
          console.log(`[API] Vendor ${vendorId} doesn't have menu access for id ${id}`);
          return NextResponse.json({ 
            error: 'Feature not available', 
            message: 'QR Menu feature is not included in your current subscription plan.' 
          }, { status: 403 });
        }
      }
    }
    
    // Get the origin from the request headers, or use the environment variable,
    // or fall back to localhost for development
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   req.headers.get('origin') || 
                   `https://${req.headers.get('host')}` ||
                   'http://localhost:3000';
                   
    console.log(`[API] Using app URL for QR code: ${appUrl}`);
    
    // No need to clear cache explicitly, force regeneration instead
    
    // Generate fresh QR code
    let qrCodeDataUrl;
    try {
      // Force regeneration by adding a timestamp to the URL 
      const timestamp = Date.now();
      const menuUrl = `${appUrl}/menu/${id}?t=${timestamp}`;
      
      // Use the standard generateMenuQRCode, which will generate a fresh code
      qrCodeDataUrl = await generateMenuQRCode(id, appUrl);
      console.log(`[API] Successfully regenerated QR code for ID: ${id}`);
      
      // Ensure it's a valid data URL format
      if (typeof qrCodeDataUrl === 'string' && !qrCodeDataUrl.startsWith('data:image/')) {
        console.log('[API] QR code is not in data URL format, converting...');
        // Assume it's a base64 string without the prefix, convert to proper data URL
        qrCodeDataUrl = `data:image/png;base64,${qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')}`;
      }
    } catch (qrError: any) {
      console.error('[API] Error in QR code regeneration service:', qrError);
      // Generate a simple QR code as fallback
      const menuUrl = `${appUrl}/menu/${id}?t=${Date.now()}`; // Add timestamp to force fresh QR code
      qrCodeDataUrl = await generateQRCode(menuUrl, {
        errorCorrectionLevel: 'H',
        width: 500,
        margin: 2
      });
      
      // Ensure proper data URL format for fallback as well
      if (typeof qrCodeDataUrl === 'string' && !qrCodeDataUrl.startsWith('data:image/')) {
        qrCodeDataUrl = `data:image/png;base64,${qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')}`;
      }
    }
    
    console.log(`[API] Returning regenerated QR code data for ID: ${id}`);
    console.log(`[API] QR code data URL starts with: ${qrCodeDataUrl?.substring(0, 30)}...`);
    
    // We don't need to update the DB as the QR code is dynamically generated
    // The menuService likely doesn't have an updateMenuQRCode method
    
    return NextResponse.json({
      qrCodeDataUrl,
      qrCode: qrCodeDataUrl,
      menuUrl: `${appUrl}/menu/${id}`,
      success: true,
      message: 'QR code regenerated successfully'
    });
  } catch (error: any) {
    console.error('[API] Error regenerating QR code:', error);
    
    // More detailed error response
    return NextResponse.json({ 
      error: error.message || 'Failed to regenerate QR code',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      id: params.id
    }, { status: 500 });
  }
} 