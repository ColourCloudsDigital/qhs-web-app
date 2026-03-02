import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { getUserVendorId } from '@/lib/utils/vendor';
import { UserRole } from '@/lib/types/enums';
import { checkUserPermissions, checkModuleAccess } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';


// Get all menu categories for a vendor's hotel
export async function GET(req: NextRequest) {
  try {
    console.log('[API] Starting /api/vendor/menus GET request');
    
    const session = await getServerSession(authOptions);
    console.log('[API] Session:', session ? 'exists' : 'null');
    
    if (!session?.user) {
      console.log('[API] No user in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[API] User role:', session.user.role);
    
    // Make sure user is a vendor or super admin
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      console.log('[API] User is not vendor or super admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get the vendor ID and selected hotel ID
    console.log('[API] Getting vendorId and hotelId');
    const { vendorId, selectedHotelId } = await getUserVendorId(session);
    console.log('[API] VendorId:', vendorId);
    console.log('[API] HotelId:', selectedHotelId);
    
    if (!vendorId || !selectedHotelId) {
      console.log('[API] Vendor or hotel not found');
      return NextResponse.json({ error: 'Vendor or hotel not found' }, { status: 404 });
    }
    
    // Check if the vendor has access to QR Menu based on subscription
    console.log('[API] Checking menu access');
    const hasMenuAccess = await menuService.checkMenuAccess(selectedHotelId, vendorId);
    console.log('[API] Has menu access:', hasMenuAccess);
    
    if (!hasMenuAccess && session.user.role !== UserRole.SUPER_ADMIN) {
      console.log('[API] No menu access and not super admin');
      return NextResponse.json({ 
        error: 'Feature not available', 
        message: 'QR Menu feature is not included in your current subscription plan.' 
      }, { status: 403 });
    }
    
    // Get all categories with their menu items
    console.log('[API] Getting categories');
    const categories = await menuService.getCategoriesByHotelId(selectedHotelId);
    console.log('[API] Categories count:', categories.length);
    
    console.log('[API] Getting items for each category');
    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await menuService.getItemsByCategoryId(category.id);
        return {
          ...category,
          items
        };
      })
    );
    
    // Get menu settings
    console.log('[API] Getting menu settings');
    const settings = await menuService.getMenuSettings(selectedHotelId);
    
    console.log('[API] Successfully completed /api/vendor/menus GET request');
    return NextResponse.json({ 
      categories: categoriesWithItems, 
      settings,
      hotelId: selectedHotelId
    });
  } catch (error: any) {
    console.error('[API] Error fetching menu data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch menu data' }, { status: 500 });
  }
}

// Create a new menu category
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
    
    // Get the vendor ID and selected hotel ID
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
    
    // Validate incoming data
    if (!data.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    // Get existing categories to determine the display order
    const existingCategories = await menuService.getCategoriesByHotelId(selectedHotelId);
    const displayOrder = existingCategories.length > 0 
      ? Math.max(...existingCategories.map(c => c.displayOrder)) + 1 
      : 0;
    
    // Create the category
    const categoryId = await menuService.createCategory({
      hotelId: selectedHotelId,
      name: data.name,
      description: data.description,
      displayOrder,
      isActive: data.isActive !== undefined ? data.isActive : true
    });
    
    const newCategory = {
      id: categoryId,
      hotelId: selectedHotelId,
      name: data.name,
      description: data.description,
      displayOrder,
      isActive: data.isActive !== undefined ? data.isActive : true,
      items: []
    };
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error creating menu category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create menu category' }, { status: 500 });
  }
} 
