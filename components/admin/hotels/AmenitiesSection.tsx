import { FormSection } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Amenity } from './types';
import { 
  Wifi, Coffee, Tv, Utensils, Car, Dumbbell, WavesLadder, AirVent, 
  Snowflake, Cross, Baby, PawPrint, Shield, Wind, Umbrella, Users
} from 'lucide-react';

// Map amenity icons to Lucide icons
const iconMap: Record<string, React.ReactNode> = {
  'wifi': <Wifi className="h-5 w-5" />,
  'coffee': <Coffee className="h-5 w-5" />,
  'tv': <Tv className="h-5 w-5" />,
  'restaurant': <Utensils className="h-5 w-5" />,
  'parking': <Car className="h-5 w-5" />,
  'gym': <Dumbbell className="h-5 w-5" />,
  'pool': <WavesLadder className="h-5 w-5" />,
  'ac': <AirVent className="h-5 w-5" />,
  'air-conditioning': <Snowflake className="h-5 w-5" />,
  'spa': <Cross className="h-5 w-5" />,
  'baby': <Baby className="h-5 w-5" />,
  'pets': <PawPrint className="h-5 w-5" />,
  'security': <Shield className="h-5 w-5" />,
  'fan': <Wind className="h-5 w-5" />,
  'beach': <Umbrella className="h-5 w-5" />,
  'meeting': <Users className="h-5 w-5" />,
  // Add more icon mappings as needed
};

// Helper function to get icon by key or name
function getIconForAmenity(amenity: Amenity): React.ReactNode {
  // Try to get icon by the icon field
  if (amenity.icon && iconMap[amenity.icon.toLowerCase()]) {
    return iconMap[amenity.icon.toLowerCase()];
  }
  
  // Try to get icon by name
  if (iconMap[amenity.name.toLowerCase()]) {
    return iconMap[amenity.name.toLowerCase()];
  }
  
  // Default icon - use first character of amenity name
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-primary">
      {amenity.name.charAt(0).toUpperCase()}
    </div>
  );
}

interface AmenitiesSectionProps {
  amenities: Amenity[];
  selectedAmenities: string[];
  onAmenityChange: (amenityId: string, checked: boolean) => void;
}

export function AmenitiesSection({
  amenities,
  selectedAmenities,
  onAmenityChange
}: AmenitiesSectionProps) {
  return (
    <FormSection title="Amenities" description="Select the amenities available at this hotel">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {amenities.map((amenity) => (
          <div key={amenity.id} className="flex items-start space-x-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <Checkbox
              checked={selectedAmenities.includes(amenity.id)}
              onChange={(checked: boolean) => onAmenityChange(amenity.id, checked)}
            />
            <div className="flex items-start space-x-2">
              <div className="flex h-6 w-6 items-center justify-center text-primary">
                {getIconForAmenity(amenity)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{amenity.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{amenity.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}