'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StaffData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  permissions: string[];
  hotelId?: string;
  hotelName?: string;
  vendorId?: string;
  vendorName?: string;
  isActive: boolean;
  createdAt?: string;
}

interface StaffPermissionsContextType {
  staffData: StaffData | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const StaffPermissionsContext = createContext<StaffPermissionsContextType | undefined>(undefined);

export function StaffPermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffData = async () => {
    if (!session?.user?.staffId) {
      setError('User is not a staff member');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get detailed staff information using the staffId from session
      const detailResponse = await fetch(`/api/staff/${session.user.staffId}`);
      if (!detailResponse.ok) {
        throw new Error('Failed to fetch staff details');
      }

      const detailData = await detailResponse.json();
      setStaffData(detailData);
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [session?.user?.staffId]);

  const hasPermission = (permission: string): boolean => {
    if (!staffData || !staffData.permissions) return false;
    return staffData.permissions.includes(permission);
  };

  const permissions = staffData?.permissions || [];

  const value: StaffPermissionsContextType = {
    staffData,
    permissions,
    hasPermission,
    loading,
    error,
    refetch: fetchStaffData,
  };

  return (
    <StaffPermissionsContext.Provider value={value}>
      {children}
    </StaffPermissionsContext.Provider>
  );
}

export function useStaffPermissions() {
  const context = useContext(StaffPermissionsContext);
  if (context === undefined) {
    throw new Error('useStaffPermissions must be used within a StaffPermissionsProvider');
  }
  return context;
}