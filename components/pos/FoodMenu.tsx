'use client';

import { useState } from 'react';
import { Plus, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  isAvailable?: boolean;
  allergens?: string;
  preparationTime?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface FoodMenuProps {
  categories: Category[];
  onAddItem: (item: { id: string; name: string; price: number; image?: string }) => void;
}

export default function FoodMenu({ categories, onAddItem }: FoodMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [search, setSearch] = useState('');

  const activeItems = categories
    .find(c => c.id === activeCategory)
    ?.items.filter(item =>
      item.isAvailable !== false &&
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()))
    ) || [];

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {activeItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No items found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {activeItems.map(item => {
            const price = item.discountedPrice ?? item.price;
            return (
              <button
                key={item.id}
                onClick={() => onAddItem({ id: item.id, name: item.name, price, image: item.image })}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Image */}
                <div className="relative h-28 w-full shrink-0 bg-gray-100 dark:bg-gray-700">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.jpg'; }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🍽️</div>
                  )}
                  {/* Add overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                    <Plus className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  {/* Dietary badges */}
                  <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
                    {item.isVegan && <span className="rounded bg-green-500 px-1 py-0.5 text-[10px] font-bold text-white">V</span>}
                    {item.isGlutenFree && <span className="rounded bg-amber-500 px-1 py-0.5 text-[10px] font-bold text-white">GF</span>}
                    {item.isSpicy && <span className="rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">🌶</span>}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>

                  {/* Description */}
                  {item.description && (
                    <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  )}

                  {/* Prep time + allergens row */}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {item.preparationTime && (
                      <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        {item.preparationTime}m
                      </span>
                    )}
                    {item.allergens && (
                      <span className="flex items-center gap-0.5 text-[11px] text-amber-500" title={`Allergens: ${item.allergens}`}>
                        <AlertTriangle className="h-3 w-3" />
                        <span className="truncate max-w-[80px]">{item.allergens}</span>
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-primary">{formatCurrency(price)}</span>
                    {item.discountedPrice && (
                      <span className="text-xs text-gray-400 line-through">{formatCurrency(item.price)}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
