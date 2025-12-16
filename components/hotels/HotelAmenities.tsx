'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface HotelAmenitiesProps {
  amenities: Amenity[];
}

export default function HotelAmenities({ amenities }: HotelAmenitiesProps) {
  const [expanded, setExpanded] = useState(false);

  // Group amenities by category
  const groupedAmenities = amenities.reduce((groups, amenity) => {
    if (!groups[amenity.category]) {
      groups[amenity.category] = [];
    }
    groups[amenity.category].push(amenity);
    return groups;
  }, {} as Record<string, Amenity[]>);

  // Convert category groups to array and sort alphabetically
  const categories = Object.keys(groupedAmenities).sort();

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Determine how many amenities to show in preview mode
  const previewLimit = 8;
  const totalAmenities = amenities.length;
  const previewAmenities = amenities.slice(0, previewLimit);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Hotel Amenities</h2>
      
      {!expanded ? (
        // Preview mode - show limited amenities in simple grid
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {previewAmenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{amenity.name}</span>
              </div>
            ))}
          </div>
          
          {totalAmenities > previewLimit && (
            <button
              onClick={toggleExpanded}
              className="mt-4 flex items-center text-sm font-medium text-primary hover:text-primary-dark"
            >
              Show all {totalAmenities} amenities
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        // Expanded mode - show all amenities grouped by category
        <div className="mb-4">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {groupedAmenities[category].map((amenity) => (
                  <div key={amenity.id} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <button
            onClick={toggleExpanded}
            className="mt-2 flex items-center text-sm font-medium text-primary hover:text-primary-dark"
          >
            Show less
            <ChevronUp className="ml-1 h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}