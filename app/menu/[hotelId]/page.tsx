'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Search } from 'lucide-react';
import { MenuCategory, MenuItem, MenuSettings } from '@/lib/services/menu.service';

// Extend MenuItem with categoryName for search results
interface MenuItemWithCategory extends MenuItem {
  categoryName?: string;
}

export default function MenuPage() {
  const { hotelId } = useParams();
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<{
    categories: (MenuCategory & { items: MenuItem[] })[];
    settings: MenuSettings;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItemWithCategory[]>([]);

  useEffect(() => {
    async function fetchMenuData() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/menus/${hotelId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to load menu (${res.status})`);
        }
        
        const data = await res.json();
        setMenuData(data);
        
        // Track a view
        try {
          await fetch(`/api/menus/view/${hotelId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referrer: document.referrer,
              userAgent: navigator.userAgent,
            }),
          });
        } catch (viewError) {
          // Silently fail for tracking - non-critical
          console.error('Error tracking view:', viewError);
        }
      } catch (error: any) {
        console.error('Error fetching menu data:', error);
        setError(error.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    
    if (hotelId) {
      fetchMenuData();
    }
  }, [hotelId]);

  // Handle search/filtering
  useEffect(() => {
    if (!menuData || !searchQuery.trim()) {
      setFilteredItems([]);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const results: MenuItemWithCategory[] = [];
    
    menuData.categories.forEach(category => {
      category.items.forEach(item => {
        if (
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.ingredients && item.ingredients.toLowerCase().includes(query)) ||
          (item.allergens && item.allergens.toLowerCase().includes(query))
        ) {
          results.push({
            ...item,
            categoryName: category.name // Add category name for context
          });
        }
      });
    });
    
    setFilteredItems(results);
  }, [searchQuery, menuData]);

  // Apply theme color styles
  useEffect(() => {
    if (menuData?.settings) {
      const root = document.documentElement;
      root.style.setProperty('--primary', menuData.settings.primaryColor || '#1e3a8a');
      root.style.setProperty('--secondary', menuData.settings.secondaryColor || '#34a853');
      
      // Set the page title
      document.title = 'Restaurant Menu';
    }
    
    return () => {
      // Clean up when component unmounts
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
    };
  }, [menuData?.settings]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
          <div className="flex flex-col items-center space-y-6">
            <Skeleton className="h-12 w-32 rounded" />
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />

            <div className="mt-8 w-full space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <Skeleton className="h-5 w-32 rounded mb-2" />
                        <Skeleton className="h-4 w-48 rounded mb-1" />
                        <Skeleton className="h-3 w-24 rounded" />
                      </div>
                      <Skeleton className="h-6 w-14 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <footer className="bg-gray-900 text-gray-100 py-6 px-4 mt-auto">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center">
              <p className="text-sm">Powered by Qaras Hotels</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Menu Unavailable</h1>
            <p className="text-gray-600 text-center mb-6">
              {error || "We couldn't load the menu at this time. Please try again later."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
        <footer className="bg-gray-900 text-gray-100 py-6 px-4 mt-auto">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center">
              <p className="text-sm">Powered by Qaras Hotels</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const { categories, settings } = menuData;
  const menuTitle = 'Our Menu';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header section */}
      <header 
        className="bg-primary text-white py-8 px-4 text-center relative"
        style={{ backgroundColor: settings.primaryColor || '#1e3a8a' }}
      >
        {settings.bannerUrl && (
          <div className="absolute inset-0 bg-cover bg-center opacity-20 z-0" style={{ 
            backgroundImage: `url(${settings.bannerUrl})`,
          }} />
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto">
          {settings.logoUrl && (
            <div className="flex justify-center mb-4">
              <Image
                src={settings.logoUrl}
                alt="Restaurant Logo"
                width={100}
                height={100}
                className="object-contain h-20 w-auto rounded-full shadow-lg"
              />
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-2" style={{ 
            fontFamily: settings.fontFamily || 'inherit'
          }}>
            {menuTitle}
          </h1>
        </div>
      </header>

      {/* Search bar */}
      <div className="sticky top-0 bg-white shadow-md z-20 p-4 border-b backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search our menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
        {/* Search results */}
        {searchQuery.trim() && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Search Results {filteredItems.length > 0 && `(${filteredItems.length})`}
            </h2>
            
            {filteredItems.length === 0 ? (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription>
                  No items found matching &quot;{searchQuery}&quot;
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.categoryName}</div>
                              
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-1 mt-2">
                                {/* Food attribute icons */}
                                {item.isVegan && (
                                  <div className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                    <Image
                                      src="/assets/icons/vegan.png"
                                      alt="Vegan"
                                      width={16}
                                      height={16}
                                      className="mr-1"
                                    />
                                    Vegan
                                  </div>
                                )}
                                {item.isGlutenFree && (
                                  <div className="flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                    <Image
                                      src="/assets/icons/gluten-free.png"
                                      alt="Gluten Free"
                                      width={16}
                                      height={16}
                                      className="mr-1"
                                    />
                                    Gluten Free
                                  </div>
                                )}
                                {item.isSpicy && (
                                  <div className="flex items-center bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                    <Image
                                      src="/assets/icons/spicy.png"
                                      alt="Spicy"
                                      width={16}
                                      height={16}
                                      className="mr-1"
                                    />
                                    Spicy
                                  </div>
                                )}
                                {item.preparationTime && (
                                  <div className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {item.preparationTime} min
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="font-medium text-lg">₦{parseFloat(item.price as any).toFixed(2)}</div>
                          {item.discountedPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              ₦{parseFloat(item.discountedPrice as any).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu tabs */}
        {!searchQuery.trim() && categories.length > 0 && (
          <Tabs defaultValue={categories[0].id} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="flex w-max bg-white rounded-full p-1 shadow-sm">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="px-4 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                    style={{
                      '--tab-active-bg': settings.primaryColor || '#1e3a8a'
                    } as any}
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                {category.description && (
                  <p className="text-gray-600 mb-4 italic">
                    {category.description}
                  </p>
                )}
                
                {/* Items list */}
                <div className="space-y-4">
                  {category.items.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      No items in this category.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.items.map((item) => (
                        <Card
                          key={item.id}
                          className="overflow-hidden hover:shadow-md transition-all border-none shadow-sm hover:scale-[1.01]"
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.description}
                                  </p>
                                )}
                                
                                {item.ingredients && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    <span className="font-medium">Ingredients:</span> {item.ingredients}
                                  </p>
                                )}
                                
                                {item.allergens && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    <span className="font-medium">Allergens:</span> {item.allergens}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-1 mt-2">
                                  {/* Food attribute icons */}
                                  {item.isVegan && (
                                    <div className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                      <Image
                                        src="/assets/icons/vegan.png"
                                        alt="Vegan"
                                        width={16}
                                        height={16}
                                        className="mr-1"
                                      />
                                      Vegan
                                    </div>
                                  )}
                                  {item.isGlutenFree && (
                                    <div className="flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                      <Image
                                        src="/assets/icons/gluten-free.png"
                                        alt="Gluten Free"
                                        width={16}
                                        height={16}
                                        className="mr-1"
                                      />
                                      Gluten Free
                                    </div>
                                  )}
                                  {item.isSpicy && (
                                    <div className="flex items-center bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                      <Image
                                        src="/assets/icons/spicy.png"
                                        alt="Spicy"
                                        width={16}
                                        height={16}
                                        className="mr-1"
                                      />
                                      Spicy
                                    </div>
                                  )}
                                  {item.preparationTime && (
                                    <div className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {item.preparationTime} min
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end ml-4">
                                <div className="font-medium text-lg" style={{ color: settings.primaryColor }}>
                                  ₦{parseFloat(item.price as any).toFixed(2)}
                                </div>
                                {item.discountedPrice && (
                                  <div className="text-sm text-gray-500 line-through">
                                    ₦{parseFloat(item.discountedPrice as any).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 px-4 mt-auto">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-300 text-sm">
                Powered by Qaras Hotels
              </p>
            </div>
            <div className="text-gray-300 text-sm">
              <p>&copy; {new Date().getFullYear()} All rights reserved</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 