import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { getUserVendorId } from '@/lib/utils/vendor';
import { UserRole } from '@/lib/types/enums';

// Create a new menu item
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
    
    // Validate required fields
    if (!data.name || !data.categoryId || data.price === undefined) {
      return NextResponse.json({ error: 'Name, category ID, and price are required' }, { status: 400 });
    }
    
    // Validate that the category exists and belongs to this hotel
    const categories = await menuService.getCategoriesByHotelId(selectedHotelId);
    const category = categories.find(c => c.id === data.categoryId);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Get existing items to determine display order
    const existingItems = await menuService.getItemsByCategoryId(data.categoryId);
    const displayOrder = existingItems.length > 0
      ? Math.max(...existingItems.map(i => i.displayOrder)) + 1
      : 0;
    
    // Create the menu item
    const itemId = await menuService.createMenuItem({
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : undefined,
      image: data.image,
      ingredients: data.ingredients,
      allergens: data.allergens,
      isVegetarian: data.isVegetarian,
      isVegan: data.isVegan,
      isGlutenFree: data.isGlutenFree,
      isSpicy: data.isSpicy,
      calories: data.calories ? parseInt(data.calories) : undefined,
      preparationTime: data.preparationTime ? parseInt(data.preparationTime) : undefined,
      displayOrder,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isFeatured: data.isFeatured
    });
    
    const newItem = {
      id: itemId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
      image: data.image,
      ingredients: data.ingredients,
      allergens: data.allergens,
      isVegetarian: data.isVegetarian || false,
      isVegan: data.isVegan || false,
      isGlutenFree: data.isGlutenFree || false,
      isSpicy: data.isSpicy || false,
      calories: data.calories ? parseInt(data.calories) : null,
      preparationTime: data.preparationTime ? parseInt(data.preparationTime) : null,
      displayOrder,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isFeatured: data.isFeatured || false
    };
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error creating menu item:', error);
    return NextResponse.json({ error: error.message || 'Failed to create menu item' }, { status: 500 });
  }
} 