'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface SearchFiltersProps {
  currentFilters: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
    amenities?: string[];
  };
  amenities: Amenity[];
}

export default function SearchFilters({ currentFilters, amenities }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    location: currentFilters.location || '',
    minPrice: currentFilters.minPrice || '',
    maxPrice: currentFilters.maxPrice || '',
    capacity: currentFilters.capacity || '',
    amenities: currentFilters.amenities || []
  });

  const [expanded, setExpanded] = useState({
    price: true,
    capacity: true,
    amenities: true
  });

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Check for screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Show filters by default on large screens
  useEffect(() => {
    setFiltersVisible(!isSmallScreen);
  }, [isSmallScreen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove location parameter
    if (filters.location) {
      params.set('location', filters.location);
    } else {
      params.delete('location');
    }
    
    // Update or remove price parameters
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice.toString());
    } else {
      params.delete('minPrice');
    }
    
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice.toString());
    } else {
      params.delete('maxPrice');
    }
    
    // Update or remove capacity parameter
    if (filters.capacity) {
      params.set('capacity', filters.capacity.toString());
    } else {
      params.delete('capacity');
    }
    
    // Update or remove amenities parameter
    if (filters.amenities && filters.amenities.length > 0) {
      // Remove existing amenities parameters
      params.delete('amenities');
      
      // Add each amenity as a separate parameter with the same key
      filters.amenities.forEach((amenity) => {
        params.append('amenities', amenity);
      });
    } else {
      params.delete('amenities');
    }
    
    // Reset to page 1 when applying new filters
    params.set('page', '1');
    
    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    // Reset the filter values and update the URL
    setFilters({
      location: '',
      minPrice: '',
      maxPrice: '',
      capacity: '',
      amenities: []
    });
    
    router.push('/hotels');
  };

  const handleAmenityChange = (amenityName: string) => {
    setFilters((prev) => {
      const amenities = [...prev.amenities];
      
      if (amenities.includes(amenityName)) {
        // Remove the amenity if it's already selected
        return {
          ...prev,
          amenities: amenities.filter((a) => a !== amenityName)
        };
      } else {
        // Add the amenity if it's not selected
        return {
          ...prev,
          amenities: [...amenities, amenityName]
        };
      }
    });
  };

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Group amenities by category
  const groupedAmenities = amenities.reduce((groups, amenity) => {
    if (!groups[amenity.category]) {
      groups[amenity.category] = [];
    }
    groups[amenity.category].push(amenity);
    return groups;
  }, {} as Record<string, Amenity[]>);

  return (
    <div>
      {/* Mobile filter toggle */}
      {isSmallScreen && (
        <button
          className="mb-4 flex w-full items-center justify-between rounded-md border border-gray-300 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          onClick={toggleFilters}
        >
          <span className="font-medium">Filters</span>
          {filtersVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      )}
      
      {/* Filters content */}
      {filtersVisible && (
        <form onSubmit={handleSearch} className="sticky top-20 space-y-6 rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
          <div>
            <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City, state, or country"
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {filters.location && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setFilters({ ...filters, location: '' })}
                  aria-label="Clear location"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          
          <div>
            <div className="mb-2 flex cursor-pointer items-center justify-between" onClick={() => toggleSection('price')}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Range</h3>
              {expanded.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expanded.price && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="minPrice" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Min Price (NGN)
                  </label>
                  <input
                    type="number"
                    id="minPrice"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseInt(e.target.value) : '' })}
                    min="0"
                    placeholder="Min"
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Max Price (NGN)
                  </label>
                  <input
                    type="number"
                    id="maxPrice"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseInt(e.target.value) : '' })}
                    min="0"
                    placeholder="Max"
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="mb-2 flex cursor-pointer items-center justify-between" onClick={() => toggleSection('capacity')}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Guests</h3>
              {expanded.capacity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expanded.capacity && (
              <div>
                <label htmlFor="capacity" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  Minimum capacity
                </label>
                <select
                  id="capacity"
                  value={filters.capacity}
                  onChange={(e) => setFilters({ ...filters, capacity: e.target.value ? parseInt(e.target.value) : '' })}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div>
            <div className="mb-2 flex cursor-pointer items-center justify-between" onClick={() => toggleSection('amenities')}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Amenities</h3>
              {expanded.amenities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expanded.amenities && (
              <div className="max-h-60 overflow-y-auto pr-2">
                {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
                  <div key={category} className="mb-3">
                    <h4 className="mb-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryAmenities.map((amenity) => (
                        <label key={amenity.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.amenities.includes(amenity.name)}
                            onChange={() => handleAmenityChange(amenity.name)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{amenity.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}