'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { MenuCategory, MenuItem } from '@/lib/services/menu.service';
import MenuItemForm from './MenuItemForm';
import Image from 'next/image';

interface MenuCategoriesListProps {
  categories: (MenuCategory & { items: MenuItem[] })[];
  hotelId: string;
  onDataUpdate: (data: any) => void;
}

export default function MenuCategoriesList({ categories, hotelId, onDataUpdate }: MenuCategoriesListProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(categories[0]?.id || null);
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [isEditingCategory, setIsEditingCategory] = useState<boolean>(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [newCategory, setNewCategory] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [isEditingItem, setIsEditingItem] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);
  const { toast } = useToast();

  // Handle category creation
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a category name',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/vendor/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create category');
      }

      const newCategoryData = await res.json();
      
      // Update local state with the new category
      onDataUpdate({
        categories: [...categories, newCategoryData],
        hotelId,
      });
      
      // Expand the new category
      setExpandedCategory(newCategoryData.id);
      
      // Reset form
      setNewCategory({ name: '', description: '' });
      setIsAddingCategory(false);
      
      toast({
        title: 'Category added',
        description: `${newCategory.name} has been added to your menu`,
      });
    } catch (error: any) {
      toast({
        title: 'Error adding category',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle category update
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/menus/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedCategory.name,
          description: selectedCategory.description,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update category');
      }

      const updatedCategory = await res.json();
      
      // Update local state with the updated category
      const updatedCategories = categories.map(category => 
        category.id === selectedCategory.id ? updatedCategory : category
      );
      
      onDataUpdate({
        categories: updatedCategories,
        hotelId,
      });
      
      setIsEditingCategory(false);
      
      toast({
        title: 'Category updated',
        description: `${selectedCategory.name} has been updated`,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating category',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/menus/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      // Update local state by removing the deleted category
      const updatedCategories = categories.filter(category => category.id !== selectedCategory.id);
      
      onDataUpdate({
        categories: updatedCategories,
        hotelId,
      });
      
      setIsDeletingCategory(false);
      setExpandedCategory(updatedCategories[0]?.id || null);
      
      toast({
        title: 'Category deleted',
        description: `${selectedCategory.name} has been removed from your menu`,
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting category',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle item creation success
  const handleItemAdded = (newItem: MenuItem, categoryId: string) => {
    // Find the category and add the new item to it
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: [...category.items, newItem],
        };
      }
      return category;
    });
    
    onDataUpdate({
      categories: updatedCategories,
      hotelId,
    });
    
    setIsAddingItem(false);
  };

  // Handle move category order
  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    // Find current category index
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;
    
    // Calculate new index
    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    
    // Validate new index is within bounds
    if (newIndex < 0 || newIndex >= categories.length) return;
    
    // Create a copy of categories for reordering
    const updatedCategories = [...categories];
    
    // Get the categories to swap
    const categoryToMove = updatedCategories[categoryIndex];
    const categoryToSwapWith = updatedCategories[newIndex];
    
    // Swap display orders
    const tempOrder = categoryToMove.displayOrder;
    categoryToMove.displayOrder = categoryToSwapWith.displayOrder;
    categoryToSwapWith.displayOrder = tempOrder;
    
    // Swap positions in array
    updatedCategories[categoryIndex] = categoryToSwapWith;
    updatedCategories[newIndex] = categoryToMove;
    
    // Update on server (both categories)
    try {
      setLoading(true);
      
      // Update first category
      await fetch(`/api/vendor/menus/categories/${categoryToMove.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayOrder: categoryToMove.displayOrder,
        }),
      });
      
      // Update second category
      await fetch(`/api/vendor/menus/categories/${categoryToSwapWith.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayOrder: categoryToSwapWith.displayOrder,
        }),
      });
      
      // Update local state
      onDataUpdate({
        categories: updatedCategories,
        hotelId,
      });
      
      toast({
        title: 'Categories reordered',
        description: 'Menu categories have been reordered',
      });
    } catch (error: any) {
      toast({
        title: 'Error reordering categories',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit menu item
  const handleEditMenuItem = (item: MenuItem, categoryId: string) => {
    setSelectedItem(item);
    setIsEditingItem(true);
  };

  // Handle item update
  const handleItemUpdated = (updatedItem: MenuItem) => {
    // Find the category and update the item within it
    const updatedCategories = categories.map(category => {
      if (category.id === updatedItem.categoryId) {
        return {
          ...category,
          items: category.items.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          ),
        };
      }
      return category;
    });
    
    onDataUpdate({
      categories: updatedCategories,
      hotelId,
    });
    
    setIsEditingItem(false);
    setSelectedItem(null);
    
    toast({
      title: 'Item updated',
      description: `${updatedItem.name} has been updated`,
    });
  };

  // Handle delete menu item
  const handleDeleteMenuItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeletingItem(true);
  };

  // Handle confirm delete menu item
  const confirmDeleteMenuItem = async () => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/menus/items/${selectedItem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }
      
      // Update local state by removing the deleted item
      const updatedCategories = categories.map(category => {
        if (category.id === selectedItem.categoryId) {
          return {
            ...category,
            items: category.items.filter(item => item.id !== selectedItem.id),
          };
        }
        return category;
      });
      
      onDataUpdate({
        categories: updatedCategories,
        hotelId,
      });
      
      setIsDeletingItem(false);
      setSelectedItem(null);
      
      toast({
        title: 'Item deleted',
        description: `${selectedItem.name} has been removed from your menu`,
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting item',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Menu Categories</h2>
        <Button onClick={() => setIsAddingCategory(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500">No categories yet. Add your first category to get started.</p>
        </div>
      ) : (
        <Accordion
          type="single"
          value={expandedCategory || undefined}
          onValueChange={(value) => setExpandedCategory(value)}
          collapsible
          className="space-y-4"
        >
          {categories.map((category, index) => (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex-1">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium">{category.name}</span>
                    {category.items.length > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({category.items.length} item{category.items.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </AccordionTrigger>
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  {/* Category reordering buttons */}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0 || loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveCategory(category.id, 'up');
                    }}
                    className="h-8 w-8"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === categories.length - 1 || loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveCategory(category.id, 'down');
                    }}
                    className="h-8 w-8"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                      setIsEditingCategory(true);
                    }}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                      setIsDeletingCategory(true);
                    }}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <AccordionContent className="p-4 pt-2">
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                )}
                
                {/* Items List */}
                <div className="space-y-4">
                  {category.items.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No menu items in this category yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {category.items.map((item) => (
                        <Card key={item.id} className="overflow-hidden bg-white hover:bg-gray-50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{item.name}</div>
                                  
                                  {/* Food attribute icons */}
                                  <div className="flex items-center gap-1">
                                    {item.isVegan && (
                                      <div className="relative w-5 h-5 tooltip" data-tip="Vegan">
                                        <Image
                                          src="/assets/icons/vegan.png"
                                          alt="Vegan"
                                          width={20}
                                          height={20}
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                    {item.isGlutenFree && (
                                      <div className="relative w-5 h-5 tooltip" data-tip="Gluten Free">
                                        <Image
                                          src="/assets/icons/gluten-free.png"
                                          alt="Gluten Free"
                                          width={20}
                                          height={20}
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                    {item.isSpicy && (
                                      <div className="relative w-5 h-5 tooltip" data-tip="Spicy">
                                        <Image
                                          src="/assets/icons/spicy.png"
                                          alt="Spicy"
                                          width={20}
                                          height={20}
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                    {item.preparationTime && (
                                      <div className="relative w-5 h-5 tooltip flex items-center" data-tip={`${item.preparationTime} min prep time`}>
                                        <Image
                                          src="/assets/icons/clock.png"
                                          alt="Preparation Time"
                                          width={20}
                                          height={20}
                                          className="object-contain"
                                        />
                                        <span className="text-xs ml-1">{item.preparationTime} min</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.description}
                                  </p>
                                )}
                                
                                {item.ingredients && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <span className="font-medium">Ingredients:</span> {item.ingredients}
                                  </p>
                                )}
                                
                                {item.allergens && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    <span className="font-medium text-amber-600">Allergens:</span> {item.allergens}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <div className="font-medium">₦{parseFloat(item.price as any).toFixed(2)}</div>
                                {item.discountedPrice && (
                                  <div className="text-sm text-gray-500 line-through">
                                    ₦{parseFloat(item.discountedPrice as any).toFixed(2)}
                                  </div>
                                )}
                                <div className="flex mt-2 gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleEditMenuItem(item, category.id)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteMenuItem(item)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {item.image && (
                              <div className="mt-2">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  width={100}
                                  height={75}
                                  className="rounded-md object-cover h-[75px] w-[100px]"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/images/placeholder.jpg';
                                  }}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsAddingItem(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Menu Item
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your menu items
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Appetizers, Main Course, Desserts"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the details of this menu category
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={selectedCategory.name}
                  onChange={(e) =>
                    setSelectedCategory({ ...selectedCategory, name: e.target.value })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={selectedCategory.description || ''}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={isDeletingCategory} onOpenChange={setIsDeletingCategory}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category{' '}
              <span className="font-medium">{selectedCategory?.name}</span> and all its menu items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Menu Item Dialog */}
      {selectedCategory && (
        <MenuItemForm
          open={isAddingItem}
          onOpenChange={setIsAddingItem}
          categoryId={selectedCategory.id}
          onSuccess={(newItem) => handleItemAdded(newItem, selectedCategory.id)}
        />
      )}

      {/* Edit Menu Item Dialog */}
      {selectedItem && (
        <MenuItemForm
          open={isEditingItem}
          onOpenChange={setIsEditingItem}
          categoryId={selectedItem.categoryId}
          onSuccess={handleItemUpdated}
          item={selectedItem}
        />
      )}

      {/* Delete Menu Item Dialog */}
      <AlertDialog open={isDeletingItem} onOpenChange={setIsDeletingItem}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMenuItem}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 