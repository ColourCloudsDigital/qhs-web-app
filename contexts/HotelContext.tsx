'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { UserRole } from '@/lib/types/enums';
import toast from '@/lib/toast';

export type Hotel = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  images?: string;
};

interface HotelContextType {
  currentHotel: Hotel | null;
  setCurrentHotel: (hotel: Hotel | null) => void;
  hotels: Hotel[];
  loading: boolean;
  refetchHotels: () => Promise<void>;
}

const HotelContext = createContext<HotelContextType>({
  currentHotel: null,
  setCurrentHotel: () => {},
  hotels: [],
  loading: true,
  refetchHotels: async () => {},
});

export const useHotel = () => useContext(HotelContext);

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const { impersonation } = useImpersonation();
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch hotels when session is loaded
  useEffect(() => {
    if (status === 'authenticated') {
      // Check if this is a regular vendor/staff user or a super admin impersonating a vendor
      const isVendorOrStaff = session.user.role === UserRole.VENDOR || session.user.role === UserRole.STAFF;
      // Check if a super admin is impersonating a vendor
      // The original user role of the impersonated account would be VENDOR
      const isSuperAdminImpersonatingVendor = 
        session.user.role === UserRole.SUPER_ADMIN && 
        impersonation.isImpersonating;
      
      if (isVendorOrStaff || isSuperAdminImpersonatingVendor) {
        fetchUserHotels();
      } else {
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status, impersonation]);

  // Reset current hotel when impersonation status changes
  useEffect(() => {
    // When impersonation status changes, reset the current hotel selection
    setCurrentHotel(null);
    // Clear the local storage selection too
    localStorage.removeItem('selectedHotel');
    
    if (status === 'authenticated') {
      // Refetch hotels if authenticated
      fetchUserHotels();
    }
  }, [impersonation.isImpersonating]);

  // Load saved hotel from localStorage on initial load
  useEffect(() => {
    const savedHotelJson = localStorage.getItem('selectedHotel');
    if (savedHotelJson) {
      try {
        const savedHotel = JSON.parse(savedHotelJson);
        setCurrentHotel(savedHotel);
      } catch (e) {
        console.error('Error parsing saved hotel:', e);
        localStorage.removeItem('selectedHotel');
      }
    }
  }, []);

  // Save selected hotel to localStorage when it changes
  useEffect(() => {
    if (currentHotel) {
      localStorage.setItem('selectedHotel', JSON.stringify(currentHotel));
    }
  }, [currentHotel]);

  // If hotels are loaded and no hotel is selected, select the first one
  useEffect(() => {
    if (hotels.length > 0 && !currentHotel) {
      // If there's no current hotel but we have a saved one, check if it's still valid
      const savedHotelJson = localStorage.getItem('selectedHotel');
      if (savedHotelJson) {
        try {
          const savedHotel = JSON.parse(savedHotelJson);
          const hotelStillExists = hotels.some(h => h.id === savedHotel.id);
          if (hotelStillExists) {
            // Find the updated hotel data and use it
            const updatedHotel = hotels.find(h => h.id === savedHotel.id) || null;
            setCurrentHotel(updatedHotel);
            return;
          }
        } catch (e) {
          console.error('Error processing saved hotel:', e);
        }
      }
      
      // If no valid saved hotel, use the first one
      setCurrentHotel(hotels[0]);
    }
  }, [hotels, currentHotel]);

  useEffect(() => {
    const handleRefetch = () => {
      fetchUserHotels();
    };
    
    window.addEventListener('refetch-hotels', handleRefetch);
    
    return () => {
      window.removeEventListener('refetch-hotels', handleRefetch);
    };
  }, []);

  const fetchUserHotels = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      // Handle regular vendor/staff or super admin impersonating a vendor
      if (session?.user.role === UserRole.VENDOR) {
        endpoint = '/api/vendor/hotels';
      } else if (session?.user.role === UserRole.STAFF) {
        endpoint = '/api/staff/hotels';
      } else if (session?.user.role === UserRole.SUPER_ADMIN && impersonation.isImpersonating) {
        // When super admin is impersonating, use the vendor endpoint
        endpoint = '/api/vendor/hotels';
      } else {
        setLoading(false);
        return;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const data = await response.json();
      setHotels(data.hotels || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Failed to load your hotels');
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    currentHotel,
    setCurrentHotel,
    hotels,
    loading,
    refetchHotels: fetchUserHotels
  };

  return (
    <HotelContext.Provider value={contextValue}>
      {children}
    </HotelContext.Provider>
  );
};