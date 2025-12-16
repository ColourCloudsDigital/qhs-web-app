import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { getUserVendorId } from '@/lib/utils/vendor';
import { UserRole } from '@/lib/types/enums';

// Update a menu item
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Verify the item exists and belongs to one of this hotel's categories
    const categories = await menuService.getCategoriesByHotelId(selectedHotelId);
    const categoryIds = categories.map(c => c.id);
    
    // Find the item in any of the categories
    let foundItem = null;
    for (const categoryId of categoryIds) {
      const items = await menuService.getItemsByCategoryId(categoryId);
      const item = items.find(i => i.id === params.id);
      if (item) {
        foundItem = item;
        break;
      }
    }
    
    if (!foundItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    // If changing category, verify the new category exists
    if (data.categoryId && !categoryIds.includes(data.categoryId)) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Update the menu item
    const success = await menuService.updateMenuItem(params.id, {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price !== undefined ? parseFloat(data.price) : undefined,
      discountedPrice: data.discountedPrice !== undefined 
        ? (data.discountedPrice ? parseFloat(data.discountedPrice) : null) 
        : undefined,
      image: data.image,
      ingredients: data.ingredients,
      allergens: data.allergens,
      isVegetarian: data.isVegetarian,
      isVegan: data.isVegan,
      isGlutenFree: data.isGlutenFree,
      isSpicy: data.isSpicy,
      calories: data.calories !== undefined 
        ? (data.calories ? parseInt(data.calories) : null) 
        : undefined,
      preparationTime: data.preparationTime !== undefined 
        ? (data.preparationTime ? parseInt(data.preparationTime) : null) 
        : undefined,
      displayOrder: data.displayOrder,
      isAvailable: data.isAvailable,
      isFeatured: data.isFeatured
    });
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
    }
    
    // Construct updated item object
    const updatedItem = {
      ...foundItem,
      ...data,
      price: data.price !== undefined ? parseFloat(data.price) : foundItem.price,
      discountedPrice: data.discountedPrice !== undefined 
        ? (data.discountedPrice ? parseFloat(data.discountedPrice) : null) 
        : foundItem.discountedPrice,
      calories: data.calories !== undefined 
        ? (data.calories ? parseInt(data.calories) : null) 
        : foundItem.calories,
      preparationTime: data.preparationTime !== undefined 
        ? (data.preparationTime ? parseInt(data.preparationTime) : null) 
        : foundItem.preparationTime
    };
    
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('[API] Error updating menu item:', error);
    return NextResponse.json({ error: error.message || 'Failed to update menu item' }, { status: 500 });
  }
}

// Delete a menu item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Verify the item exists and belongs to one of this hotel's categories
    const categories = await menuService.getCategoriesByHotelId(selectedHotelId);
    const categoryIds = categories.map(c => c.id);
    
    // Find the item in any of the categories
    let foundItem = null;
    for (const categoryId of categoryIds) {
      const items = await menuService.getItemsByCategoryId(categoryId);
      const item = items.find(i => i.id === params.id);
      if (item) {
        foundItem = item;
        break;
      }
    }
    
    if (!foundItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    // Delete the menu item
    const success = await menuService.deleteMenuItem(params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error deleting menu item:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete menu item' }, { status: 500 });
  }
} 