'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Clock, FolderMinus, Leaf, Scan, TagIcon } from 'lucide-react';
import { MenuCategory, MenuItem, MenuSettings } from '@/lib/services/menu.service';

// Types
type PublicMenuViewProps = {
  menuData: {
    categories: (MenuCategory & { items: MenuItem[] })[];
    settings: MenuSettings | null;
  };
  hotelId: string;
};

export default function PublicMenuView({ menuData, hotelId }: PublicMenuViewProps) {
  const { categories, settings } = menuData;
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || '');

  // Apply theme settings
  const themeStyles = {
    primaryColor: settings?.primaryColor || '#1a73e8',
    secondaryColor: settings?.secondaryColor || '#34a853',
    fontFamily: settings?.fontFamily || 'Inter, sans-serif',
    currency: settings?.currency || 'NGN',
  };

  return (
    <main className="min-h-screen bg-gray-50" style={{ fontFamily: themeStyles.fontFamily }}>
      {/* Header */}
      <header
        className="p-4 shadow-sm"
        style={{ backgroundColor: themeStyles.primaryColor, color: 'white' }}
      >
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Menu</h1>
              {settings?.bannerUrl && (
                <div className="relative h-16 w-32 mt-2">
                  <Image
                    src={settings.bannerUrl}
                    alt="Restaurant Banner"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
            <div className="text-right">
              <Scan className="h-6 w-6 ml-auto" />
              <p className="text-xs opacity-80 mt-1">Powered by Qaras Hospitality Solutions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <div className="container mx-auto max-w-3xl p-4">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderMinus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-600">Menu is empty</h2>
            <p className="text-gray-500 mt-2">No categories or items have been added yet.</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="mb-6 bg-white p-1" style={{ borderColor: themeStyles.primaryColor }}>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="px-4 py-2 whitespace-nowrap"
                    style={{
                      '--tab-active-color': themeStyles.primaryColor,
                      color: activeTab === category.id ? 'white' : 'inherit',
                      backgroundColor: activeTab === category.id ? themeStyles.primaryColor : 'transparent',
                    } as any}
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-xl font-semibold mb-1">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  )}

                  {category.items.length === 0 ? (
                    <p className="text-gray-500 py-4 text-center">No items in this category</p>
                  ) : (
                    <div className="space-y-6">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex gap-4 pb-4 ${
                            item !== category.items[category.items.length - 1]
                              ? 'border-b border-gray-100'
                              : ''
                          }`}
                        >
                          {item.image && (
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          <div className="flex flex-col flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{item.name}</h3>
                              <div className="text-right">
                                {item.discountedPrice ? (
                                  <div>
                                    <span className="text-sm line-through text-gray-400">
                                      {themeStyles.currency} {item.price.toLocaleString()}
                                    </span>
                                    <p
                                      className="font-semibold"
                                      style={{ color: themeStyles.primaryColor }}
                                    >
                                      {themeStyles.currency} {item.discountedPrice.toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p
                                    className="font-semibold"
                                    style={{ color: themeStyles.primaryColor }}
                                  >
                                    {themeStyles.currency} {item.price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.preparationTime && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                  <Clock className="h-3 w-3" />
                                  {item.preparationTime} min
                                </Badge>
                              )}
                              {item.isVegetarian && (
                                <Badge
                                  className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 text-xs"
                                  variant="secondary"
                                >
                                  <Leaf className="h-3 w-3" />
                                  Vegetarian
                                </Badge>
                              )}
                              {item.isVegan && (
                                <Badge
                                  className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 text-xs"
                                  variant="secondary"
                                >
                                  <Leaf className="h-3 w-3" />
                                  Vegan
                                </Badge>
                              )}
                              {item.isGlutenFree && (
                                <Badge
                                  className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1 text-xs"
                                  variant="secondary"
                                >
                                  <TagIcon className="h-3 w-3" />
                                  Gluten Free
                                </Badge>
                              )}
                              {item.isSpicy && (
                                <Badge
                                  className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1 text-xs"
                                  variant="secondary"
                                >
                                  🌶️ Spicy
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Qaras Hospitality Solutions</p>
      </footer>
    </main>
  );
} 