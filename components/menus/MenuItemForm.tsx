'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Leaf, Apple, Wheat, Flame } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUploader } from '@/components/admin/settings/ImageUploader';

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  onSuccess: (newItem: any) => void;
  item?: any; // Optional for edit mode
}

export default function MenuItemForm({
  open,
  onOpenChange,
  categoryId,
  onSuccess,
  item,
}: MenuItemFormProps) {
  const isEditMode = !!item;
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price ? String(item.price) : '',
    discountedPrice: item?.discountedPrice ? String(item.discountedPrice) : '',
    image: item?.image || '',
    ingredients: item?.ingredients || '',
    allergens: item?.allergens || '',
    isVegetarian: item?.isVegetarian || false,
    isVegan: item?.isVegan || false,
    isGlutenFree: item?.isGlutenFree || false,
    isSpicy: item?.isSpicy || false,
    calories: item?.calories ? String(item.calories) : '',
    preparationTime: item?.preparationTime ? String(item.preparationTime) : '',
    isAvailable: item?.isAvailable !== undefined ? item.isAvailable : true,
    isFeatured: item?.isFeatured || false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the menu item',
      });
      return false;
    }

    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      toast({
        title: 'Valid price required',
        description: 'Please enter a valid price for the menu item',
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, image: imageUrl }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = isEditMode
        ? `/api/vendor/menus/items/${item.id}`
        : '/api/vendor/menus/items';

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          discountedPrice: formData.discountedPrice
            ? parseFloat(formData.discountedPrice)
            : null,
          image: formData.image || null,
          ingredients: formData.ingredients,
          allergens: formData.allergens,
          isVegetarian: formData.isVegetarian,
          isVegan: formData.isVegan,
          isGlutenFree: formData.isGlutenFree,
          isSpicy: formData.isSpicy,
          calories: formData.calories ? parseInt(formData.calories) : null,
          preparationTime: formData.preparationTime
            ? parseInt(formData.preparationTime)
            : null,
          isAvailable: formData.isAvailable,
          isFeatured: formData.isFeatured,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save menu item');
      }

      const newItem = await res.json();
      onSuccess(newItem);

      toast({
        title: isEditMode ? 'Item updated' : 'Item added',
        description: `${formData.name} has been ${
          isEditMode ? 'updated' : 'added'
        } to your menu`,
      });
    } catch (error: any) {
      toast({
        title: isEditMode ? 'Error updating item' : 'Error adding item',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Menu Item' : 'Add Menu Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of this menu item'
              : 'Create a new item for your menu'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Chicken Curry, Caesar Salad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this item"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Item Image</Label>
              <ImageUploader
                imageUrl={formData.image}
                onUpload={handleImageUpload}
                onRemove={() => handleImageUpload('')}
                size="medium"
                aspect="landscape"
                maxSizeInMB={2}
                uploadDir="menu-items"
                entityId={isEditMode ? item.id : undefined}
                label=""
                description="Add an appetizing image of this menu item"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price (₦)</Label>
                <Input
                  id="discountedPrice"
                  name="discountedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountedPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients</Label>
              <Input
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleChange}
                placeholder="e.g. Chicken, rice, vegetables, spices"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergens</Label>
              <Input
                id="allergens"
                name="allergens"
                value={formData.allergens}
                onChange={handleChange}
                placeholder="e.g. Nuts, dairy, wheat, soy"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  min="0"
                  value={formData.calories}
                  onChange={handleChange}
                  placeholder="e.g. 450"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparationTime">Preparation Time (min)</Label>
                <Input
                  id="preparationTime"
                  name="preparationTime"
                  type="number"
                  min="0"
                  value={formData.preparationTime}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dietary Information</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                  <Checkbox
                    id="isVegetarian"
                    checked={formData.isVegetarian}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange('isVegetarian', checked)
                    }
                  />
                  <Leaf className="h-4 w-4 text-green-600 ml-1" />
                  <Label htmlFor="isVegetarian" className="cursor-pointer">
                    Vegetarian
                  </Label>
                </div>

                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                  <Checkbox
                    id="isVegan"
                    checked={formData.isVegan}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange('isVegan', checked)
                    }
                  />
                  <Apple className="h-4 w-4 text-green-700 ml-1" />
                  <Label htmlFor="isVegan" className="cursor-pointer">
                    Vegan
                  </Label>
                </div>

                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                  <Checkbox
                    id="isGlutenFree"
                    checked={formData.isGlutenFree}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange('isGlutenFree', checked)
                    }
                  />
                  <Wheat className="h-4 w-4 text-amber-600 ml-1" />
                  <Label htmlFor="isGlutenFree" className="cursor-pointer">
                    Gluten Free
                  </Label>
                </div>

                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                  <Checkbox
                    id="isSpicy"
                    checked={formData.isSpicy}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange('isSpicy', checked)
                    }
                  />
                  <Flame className="h-4 w-4 text-red-600 ml-1" />
                  <Label htmlFor="isSpicy" className="cursor-pointer">
                    Spicy
                  </Label>
                </div>
              </div>
              <Alert className="mt-2 bg-gray-50">
                <AlertDescription className="text-sm text-gray-600">
                  These attributes will be displayed as icons on your menu to help customers make informed choices.
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              <Label>Availability</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange('isAvailable', checked)
                    }
                  />
                  <Label htmlFor="isAvailable" className="cursor-pointer">
                    Available
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange('isFeatured', checked)
                    }
                  />
                  <Label htmlFor="isFeatured" className="cursor-pointer">
                    Featured Item
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 