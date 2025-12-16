import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import menuService from '@/lib/services/menu.service';
import { getUserVendorId } from '@/lib/utils/vendor';
import { UserRole } from '@/lib/types/enums';
import { checkHotelAccess } from '@/lib/utils/auth';

// Update a menu category
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
    
    // Validate that we have a category with this ID and it belongs to this hotel
    const categories = await menuService.getCategoriesByHotelId(selectedHotelId);
    const category = categories.find(c => c.id === params.id);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Update the category
    const success = await menuService.updateCategory(params.id, {
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : category.displayOrder,
      isActive: data.isActive !== undefined ? data.isActive : category.isActive
    });
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
    
    // Get updated category with items
    const items = await menuService.getItemsByCategoryId(params.id);
    
    return NextResponse.json({
      ...category,
      name: data.name || category.name,
      description: data.description !== undefined ? data.description : category.description,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : category.displayOrder,
      isActive: data.isActive !== undefined ? data.isActive : category.isActive,
      items
    });
  } catch (error: any) {
    console.error('[API] Error updating menu category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update menu category' }, { status: 500 });
  }
}

// Delete a menu category
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
    
    // Validate that we have a category with this ID and it belongs to this hotel
    const categories = await menuService.getCategoriesByHotelId(selectedHotelId);
    const category = categories.find(c => c.id === params.id);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Delete the category
    const success = await menuService.deleteCategory(params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error deleting menu category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete menu category' }, { status: 500 });
  }
} 