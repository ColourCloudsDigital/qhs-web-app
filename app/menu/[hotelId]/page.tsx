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
  const params = useParams();
  const hotelId = Array.isArray(params.hotelId) ? params.hotelId[0] : params.hotelId;
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<{
    categories: (MenuCategory & { items: MenuItem[] })[];
    settings: MenuSettings;
    hotelName?: string;
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
      document.title = menuData.settings ? `${menuData.hotelName || 'Restaurant'} Menu` : 'Restaurant Menu';
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
        {/* Fake header matching the real one */}
        <div className="bg-gray-800 text-white py-10 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-3">
            <Skeleton className="h-8 w-48 rounded-full mx-auto bg-white/20" />
            <Skeleton className="h-4 w-32 rounded-full mx-auto bg-white/10" />
          </div>
        </div>

        {/* Fake search bar */}
        <div className="sticky top-0 bg-white shadow-md z-20 p-4 border-b">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-full rounded-full bg-gray-100" />
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
          {/* Spinner + message */}
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            </div>
            <p className="text-base font-medium text-gray-700">Loading menu…</p>
            <p className="text-sm text-gray-400">Fetching the latest items for you</p>
          </div>

          {/* Fake category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {[80, 96, 72, 88].map((w, i) => (
              <Skeleton key={i} className={`h-8 w-${w === 80 ? '20' : w === 96 ? '24' : w === 72 ? '18' : '22'} rounded-full shrink-0 bg-gray-200`} />
            ))}
          </div>

          {/* Fake item cards — 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-sm">
                <Skeleton className="h-44 w-full rounded-none bg-gray-200" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded bg-gray-200" />
                  <Skeleton className="h-3 w-full rounded bg-gray-100" />
                  <Skeleton className="h-3 w-2/3 rounded bg-gray-100" />
                  <Skeleton className="h-5 w-20 rounded bg-gray-200 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <footer className="bg-gray-900 text-gray-100 py-6 px-4 mt-auto">
          <div className="container mx-auto max-w-4xl flex justify-center">
            <p className="text-sm">Powered by Qaras Hospitality Solutions</p>
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
              <p className="text-sm">Powered by Qaras Hospitality Solutions</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const { categories, settings: rawSettings } = menuData;
  const settings = rawSettings ?? {} as MenuSettings;
  const menuTitle = menuData.hotelName ? `${menuData.hotelName} Menu` : 'Our Menu';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-300">
      {/* ── HEADER — fixed, never scrolls ── */}
      <header
        className="relative text-white overflow-hidden flex-shrink-0"
        style={{ backgroundColor: settings.primaryColor || '#1e3a8a', minHeight: '200px' }}
      >
        {/* Food graffiti image — left side, fades right toward center */}
        <div
          className="absolute left-0 top-0 h-full pointer-events-none select-none"
          style={{ width: 'calc(50% - 80px)' }}
        >
          <img
            src="/assets/images/food-graffiti-style-png.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-right opacity-90"
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>

        {/* Food graffiti image — right side, fades left toward center */}
        <div
          className="absolute right-0 top-0 h-full pointer-events-none select-none"
          style={{ width: 'calc(50% - 80px)' }}
        >
          <img
            src="/assets/images/food-graffiti-style-png.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-left opacity-90"
            style={{
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>

        {/* Optional banner overlay */}
        {settings.bannerUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 z-0"
            style={{ backgroundImage: `url(${settings.bannerUrl})` }}
          />
        )}

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-12" style={{ minHeight: '200px' }}>
          {settings.logoUrl && (
            <div className="mb-4">
              <Image
                src={settings.logoUrl}
                alt="Restaurant Logo"
                width={90}
                height={90}
                className="object-contain rounded-full shadow-lg border-2 border-white/30"
              />
            </div>
          )}
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md"
            style={{ fontFamily: settings.fontFamily || 'inherit' }}
          >
            {menuTitle}
          </h1>
          <p className="mt-2 text-white/70 text-sm tracking-wide uppercase">Our Menu</p>
        </div>
      </header>

      {/* Search bar — fixed below header, never scrolls */}
      <div className="flex-shrink-0 bg-white shadow-md z-20 p-4 border-b">
        <div className="max-w-3xl mx-auto relative">
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

      {/* Scrollable content area — gray side margins, white rounded center column */}
      <main className="flex-1 overflow-y-auto bg-gray-300">
        <div className="mx-auto mt-6 mb-8 max-w-3xl bg-white rounded-2xl shadow-sm px-6 py-6">
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
                    {item.image && (
                      <div className="relative h-44 w-full bg-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
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
        {!searchQuery.trim() && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 text-lg">No menu items available yet.</p>
            <p className="text-gray-400 text-sm mt-1">Please check back later.</p>
          </div>
        )}

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
                          {/* Item image */}
                          {item.image && (
                            <div className="relative h-44 w-full bg-gray-100">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
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
                                  {item.isVegan && (
                                    <div className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                      <Image src="/assets/icons/vegan.png" alt="Vegan" width={16} height={16} className="mr-1" />
                                      Vegan
                                    </div>
                                  )}
                                  {item.isGlutenFree && (
                                    <div className="flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                      <Image src="/assets/icons/gluten-free.png" alt="Gluten Free" width={16} height={16} className="mr-1" />
                                      Gluten Free
                                    </div>
                                  )}
                                  {item.isSpicy && (
                                    <div className="flex items-center bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                      <Image src="/assets/icons/spicy.png" alt="Spicy" width={16} height={16} className="mr-1" />
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

          {/* Footer inside the white rounded card */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <p>Powered by Qaras Hospitality Solutions</p>
            <p>&copy; {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </main>
    </div>
  );
} 