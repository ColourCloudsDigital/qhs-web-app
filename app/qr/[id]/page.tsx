'use client';

import { useState, useEffect } from 'react';
import { PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from '@/lib/services/toast.service';

export default function QRMenuPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [loading, setLoading] = useState<boolean>(true);
  const [menu, setMenu] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchMenu();
    }
  }, [id]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menus/public/${id}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Menu not found' : 'Failed to load menu');
      }
      
      const data = await res.json();
      setMenu(data);
      
      // Set first category as active
      if (data.categories && data.categories.length > 0) {
        setActiveCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Extract brand colors if available
  let primaryColor = '#1e3a8a';
  let secondaryColor = '#f59e0b';
  let fontFamily = 'sans-serif';

  if (menu?.hotel?.whitelabelConfig) {
    const config = menu.hotel.whitelabelConfig;
    primaryColor = config.primaryColor || primaryColor;
    secondaryColor = config.secondaryColor || secondaryColor;
    fontFamily = config.fontFamily || fontFamily;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-400 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600">{error || 'Menu not found'}</p>
          <p className="mt-4 text-sm text-gray-500">
            This QR code may be invalid or expired. Please contact the restaurant for assistance.
          </p>
        </div>
      </div>
    );
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    // Scroll to category section
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeCategories = menu.categories
    .sort((a: any, b: any) => a.order - b.order)
    .filter((category: any) => 
      category.items && category.items.some((item: any) => item.isAvailable)
    );

  return (
    <div 
      className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-900" 
      style={{ fontFamily }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-10 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{menu.name}</h1>
            {menu.hotel && (
              <p className="text-sm text-white/90">{menu.hotel.name}</p>
            )}
          </div>
        </div>
      </header>

      {/* Hotel Info */}
      {menu.hotel && (
        <div className="container mx-auto mb-6 mt-4 px-4">
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {menu.hotel.address && (
                <div className="flex items-center">
                  <MapPinIcon className="mr-1 h-4 w-4" />
                  <span>{menu.hotel.address}, {menu.hotel.city}</span>
                </div>
              )}
              {menu.hotel.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="mr-1 h-4 w-4" />
                  <span>{menu.hotel.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu Description */}
      {menu.description && (
        <div className="container mx-auto mb-6 px-4">
          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">{menu.description}</p>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {activeCategories.length > 0 && (
        <div 
          className="sticky top-16 z-10 mb-6 overflow-x-auto bg-white shadow-sm dark:bg-gray-800"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="container mx-auto px-4">
            <div className="flex space-x-2 py-3">
              {activeCategories.map((category: any) => (
                <button
                  key={category.id}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-opacity-100 text-white'
                      : 'bg-gray-200 bg-opacity-80 text-gray-700 hover:bg-opacity-100 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  style={{
                    backgroundColor: activeCategory === category.id ? secondaryColor : undefined,
                  }}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Content */}
      <main className="container mx-auto px-4">
        {activeCategories.length > 0 ? (
          <div className="space-y-8">
            {activeCategories.map((category: any) => (
              <div 
                id={`category-${category.id}`}
                key={category.id} 
                className="scroll-mt-32 rounded-lg bg-white shadow dark:bg-gray-800"
              >
                <div 
                  className="rounded-t-lg p-4"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <h2 className="text-lg font-bold text-white">{category.name}</h2>
                  {category.description && (
                    <p className="mt-1 text-sm text-white/90">{category.description}</p>
                  )}
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {category.items
                      .filter((item: any) => item.isAvailable)
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((item: any) => (
                        <div 
                          key={item.id}
                          className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-b-0 last:pb-0 dark:border-gray-700"
                        >
                          <div className="flex-1 pr-4">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                            {item.price && (
                              <span>
                                {new Intl.NumberFormat('en-NG', {
                                  style: 'currency',
                                  currency: menu.currency || 'NGN',
                                }).format(item.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No menu items available
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 py-6 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Powered by Qaras Hospitality Solutions
        </p>
      </footer>
    </div>
  );
} 