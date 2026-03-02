import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { getUserVendorId } from '@/lib/utils/vendor';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';


// Get menu settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Make sure user is a vendor or super admin
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get hotel ID from URL params
    const hotelId = req.nextUrl.searchParams.get('hotelId');
    
    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }
    
    // Get vendor ID to check access
    const { vendorId } = await getUserVendorId(session);
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    // Check if the vendor has access to QR Menu based on subscription
    const hasMenuAccess = await menuService.checkMenuAccess(hotelId, vendorId);
    
    if (!hasMenuAccess && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Feature not available', 
        message: 'QR Menu feature is not included in your current subscription plan.' 
      }, { status: 403 });
    }
    
    // Get the menu settings
    const settings = await menuService.getMenuSettings(hotelId);
    
    // If no settings exist yet, return an empty object
    if (!settings) {
      return NextResponse.json({
        hotelId,
        isActive: true,
        title: 'Our Menu',
        showPrices: true,
        showIngredients: true,
        showAllergens: true,
        showNutrition: false,
        primaryColor: '#1e3a8a',
        secondaryColor: '#34a853',
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[API] Error getting menu settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to get menu settings' }, { status: 500 });
  }
}

// Save menu settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Make sure user is a vendor or super admin
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { vendorId, selectedHotelId } = await getUserVendorId(session);
    
    if (!vendorId || !selectedHotelId) {
      return NextResponse.json({ error: 'Vendor or hotel not found' }, { status: 404 });
    }
    
    // Check if the vendor has access to QR Menu based on subscription
    const hasMenuAccess = await menuService.checkMenuAccess(selectedHotelId, vendorId);
    
    if (!hasMenuAccess && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Feature not available', 
        message: 'QR Menu feature is not included in your current subscription plan.' 
      }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Save the settings
    const settingsId = await menuService.saveMenuSettings({
      hotelId: selectedHotelId,
      theme: data.theme,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      fontFamily: data.fontFamily,
      logoUrl: data.logoUrl,
      bannerUrl: data.bannerUrl,
      currency: data.currency,
      showPrices: data.showPrices !== undefined ? data.showPrices : true,
      enableOrdering: data.enableOrdering !== undefined ? data.enableOrdering : false,
      qrCodeStyle: data.qrCodeStyle
    });
    
    // Get the saved settings
    const settings = await menuService.getMenuSettings(selectedHotelId);
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[API] Error saving menu settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to save menu settings' }, { status: 500 });
  }
} 
