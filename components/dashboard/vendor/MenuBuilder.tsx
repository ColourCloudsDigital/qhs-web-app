'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { generateUUID } from '@/lib/utils';

type MenuBuilderProps = {
  data: {
    name: string;
    description: string;
    categories: any[];
  };
  onChange: (data: any) => void;
};

export default function MenuBuilder({ data, onChange }: MenuBuilderProps) {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
  const [itemDialogOpen, setItemDialogOpen] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Form inputs
  const [menuName, setMenuName] = useState<string>(data.name || '');
  const [menuDescription, setMenuDescription] = useState<string>(data.description || '');
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    description: '',
  });
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    isAvailable: true,
  });

  // Update parent on data change
  useEffect(() => {
    onChange({
      name: menuName,
      description: menuDescription,
      categories: data.categories,
    });
  }, [menuName, menuDescription, data.categories]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMenuName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMenuDescription(e.target.value);
  };

  const openCategoryDialog = (category: any = null) => {
    if (category) {
      setCategoryForm({
        id: category.id,
        name: category.name,
        description: category.description || '',
      });
      setEditMode(true);
    } else {
      setCategoryForm({
        id: generateUUID(),
        name: '',
        description: '',
      });
      setEditMode(false);
    }
    setCategoryDialogOpen(true);
  };

  const openItemDialog = (categoryId: string, item: any = null) => {
    const category = data.categories.find((c) => c.id === categoryId);
    setCurrentCategory(category);

    if (item) {
      setItemForm({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        isAvailable: item.isAvailable,
      });
      setCurrentItem(item);
      setEditMode(true);
    } else {
      setItemForm({
        id: generateUUID(),
        name: '',
        description: '',
        price: '',
        isAvailable: true,
      });
      setCurrentItem(null);
      setEditMode(false);
    }
    setItemDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      return;
    }

    const newCategories = [...data.categories];
    const categoryIndex = newCategories.findIndex((c) => c.id === categoryForm.id);

    const categoryData = {
      id: categoryForm.id,
      name: categoryForm.name,
      description: categoryForm.description,
      order: categoryIndex > -1 ? newCategories[categoryIndex].order : newCategories.length,
      items: categoryIndex > -1 ? newCategories[categoryIndex].items : [],
    };

    if (categoryIndex > -1) {
      newCategories[categoryIndex] = categoryData;
    } else {
      newCategories.push(categoryData);
      // Expand newly added category
      setExpandedCategories([...expandedCategories, categoryData.id]);
    }

    onChange({
      ...data,
      categories: newCategories,
    });
    setCategoryDialogOpen(false);
  };

  const handleSaveItem = () => {
    if (!itemForm.name.trim() || !itemForm.price.trim()) {
      return;
    }

    const price = parseFloat(itemForm.price);
    if (isNaN(price) || price < 0) {
      return;
    }

    const newCategories = [...data.categories];
    const categoryIndex = newCategories.findIndex((c) => c.id === currentCategory.id);

    if (categoryIndex === -1) {
      return;
    }

    const itemData = {
      id: itemForm.id,
      name: itemForm.name,
      description: itemForm.description,
      price: parseFloat(itemForm.price),
      isAvailable: itemForm.isAvailable,
      order: currentItem ? currentItem.order : (newCategories[categoryIndex].items || []).length,
    };

    const items = [...(newCategories[categoryIndex].items || [])];
    const itemIndex = items.findIndex((i) => i.id === itemForm.id);

    if (itemIndex > -1) {
      items[itemIndex] = itemData;
    } else {
      items.push(itemData);
    }

    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      items,
    };

    onChange({
      ...data,
      categories: newCategories,
    });
    setItemDialogOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = data.categories.filter((c) => c.id !== categoryId);
    onChange({
      ...data,
      categories: newCategories,
    });
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const newCategories = [...data.categories];
    const categoryIndex = newCategories.findIndex((c) => c.id === categoryId);

    if (categoryIndex === -1) {
      return;
    }

    const items = newCategories[categoryIndex].items.filter((i: any) => i.id !== itemId);
    
    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      items,
    };

    onChange({
      ...data,
      categories: newCategories,
    });
  };

  const toggleCategoryExpand = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter((id) => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    // Reordering categories
    if (type === 'category') {
      const newCategories = [...data.categories];
      const [movedCategory] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, movedCategory);

      // Update order property
      const updatedCategories = newCategories.map((category, index) => ({
        ...category,
        order: index,
      }));

      onChange({
        ...data,
        categories: updatedCategories,
      });
      return;
    }

    // Reordering items within a category
    if (type === 'item') {
      const categoryId = source.droppableId;
      const newCategories = [...data.categories];
      const categoryIndex = newCategories.findIndex((c) => c.id === categoryId);

      if (categoryIndex === -1) return;

      const items = [...newCategories[categoryIndex].items];
      const [movedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, movedItem);

      // Update order property
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: index,
      }));

      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        items: updatedItems,
      };

      onChange({
        ...data,
        categories: newCategories,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Menu Name *</label>
          <Input
            placeholder="Enter menu name"
            value={menuName}
            onChange={handleNameChange}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <Textarea
            placeholder="Enter menu description"
            value={menuDescription}
            onChange={handleDescriptionChange}
            rows={3}
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Categories</h3>
          <Button
            size="sm"
            onClick={() => openCategoryDialog()}
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories" type="category">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {data.categories.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-300 p-6 text-center">
                    <p className="text-gray-500">
                      No categories yet. Click "Add Category" to create your first category.
                    </p>
                  </div>
                ) : (
                  data.categories
                    .sort((a, b) => a.order - b.order)
                    .map((category, index) => (
                      <Draggable
                        key={category.id}
                        draggableId={category.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <Card>
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex flex-1 items-center gap-2"
                                  >
                                    <span className="text-gray-400">
                                      ≡
                                    </span>
                                    <CardTitle className="text-lg">
                                      {category.name}
                                    </CardTitle>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCategoryExpand(category.id)}
                                    >
                                      {expandedCategories.includes(category.id) ? (
                                        <ChevronUpIcon className="h-4 w-4" />
                                      ) : (
                                        <ChevronDownIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openCategoryDialog(category)}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {category.description && (
                                  <p className="text-sm text-gray-500">
                                    {category.description}
                                  </p>
                                )}
                              </CardHeader>

                              {expandedCategories.includes(category.id) && (
                                <CardContent>
                                  <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Items</h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openItemDialog(category.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                      Add Item
                                    </Button>
                                  </div>

                                  <Droppable
                                    droppableId={category.id}
                                    type="item"
                                  >
                                    {(provided) => (
                                      <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                      >
                                        {category.items && category.items.length > 0 ? (
                                          category.items
                                            .sort((a: any, b: any) => a.order - b.order)
                                            .map((item: any, itemIndex: number) => (
                                              <Draggable
                                                key={item.id}
                                                draggableId={item.id}
                                                index={itemIndex}
                                              >
                                                {(provided) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
                                                  >
                                                    <div className="flex flex-grow items-center gap-2">
                                                      <span className="font-medium">
                                                        {item.name}
                                                      </span>
                                                      <span className="text-sm text-gray-500">
                                                        {new Intl.NumberFormat('en-NG', {
                                                          style: 'currency',
                                                          currency: 'NGN',
                                                        }).format(item.price)}
                                                      </span>
                                                      {!item.isAvailable && (
                                                        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                          Unavailable
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex space-x-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          openItemDialog(
                                                            category.id,
                                                            item
                                                          );
                                                        }}
                                                      >
                                                        <PencilIcon className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleDeleteItem(
                                                            category.id,
                                                            item.id
                                                          );
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                      >
                                                        <TrashIcon className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))
                                        ) : (
                                          <div className="rounded-md border border-dashed border-gray-200 p-4 text-center">
                                            <p className="text-sm text-gray-500">
                                              No items in this category. Click "Add Item" to add one.
                                            </p>
                                          </div>
                                        )}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </CardContent>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Category Name *</label>
              <Input
                placeholder="Enter category name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter category description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Item Name *</label>
              <Input
                placeholder="Enter item name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter item description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Price (₦) *</label>
              <Input
                type="number"
                placeholder="Enter price"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                min={0}
                step={100}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="itemAvailable"
                checked={itemForm.isAvailable}
                onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="itemAvailable" className="text-sm font-medium">
                Item is available
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {editMode ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}