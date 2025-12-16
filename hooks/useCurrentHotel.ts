import { useEffect } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useParams } from 'next/navigation';
import toast from '@/lib/toast';

/**
 * Hook to get and set the current hotel
 * This ensures consistency when navigating between hotel pages
 */
export function useCurrentHotel() {
  const { currentHotel, setCurrentHotel, hotels, loading } = useHotel();
  const params = useParams();
  
  // Get hotelId from the URL if available
  const hotelIdFromUrl = params?.hotelId as string | undefined;
  
  // Set the current hotel based on URL parameter
  useEffect(() => {
    if (hotelIdFromUrl && (!currentHotel || currentHotel.id !== hotelIdFromUrl)) {
      // First check if the hotel is in our list of hotels
      const hotelFromUrl = hotels.find(h => h.id === hotelIdFromUrl);
      
      if (hotelFromUrl) {
        setCurrentHotel(hotelFromUrl);
      } else if (!loading && hotels.length > 0) {
        // If hotel not found in list, fetch it directly
        const fetchHotel = async () => {
          try {
            const response = await fetch(`/api/vendor/hotels/${hotelIdFromUrl}`);
            if (response.ok) {
              const data = await response.json();
              setCurrentHotel(data.hotel);
              
              // Add this hotel to the context's hotels list if it's not there
              // This ensures the hotel is available in the dropdown
              if (!hotels.some(h => h.id === data.hotel.id)) {
                // This will trigger a re-render of the HotelContext
                // which will update the hotels list
                const updatedHotels = [...hotels, data.hotel];
                // We need to update the hotels list in the context
                // This is a workaround since we can't directly modify the hotels array
                localStorage.setItem('vendorHotels', JSON.stringify(updatedHotels));
                // Force a refetch of hotels to update the context
                window.dispatchEvent(new CustomEvent('refetch-hotels'));
              }
            } else {
              // If hotel not found, set to the first hotel in list
              console.error('Hotel not found, using default');
              setCurrentHotel(hotels[0]);
              toast.error('Hotel not found or you don\'t have permission to access it');
            }
          } catch (error) {
            console.error('Error fetching hotel:', error);
          }
        };
        
        fetchHotel();
      }
    }
  }, [hotelIdFromUrl, hotels, currentHotel, setCurrentHotel, loading]);
  
  return { currentHotel, setCurrentHotel, loading };
}