'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types/enums';

interface ImpersonationState {
  isImpersonating: boolean;
  adminName: string | null;
  adminId: string | null;
  userName: string | null;
  userId: string | null;
  userRole: UserRole | null;
}

interface ImpersonationContextType {
  impersonation: ImpersonationState;
  endImpersonation: () => Promise<void>;
  isLoading: boolean;
}

const initialState: ImpersonationState = {
  isImpersonating: false,
  adminName: null,
  adminId: null,
  userName: null,
  userId: null,
  userRole: null,
};

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonation: initialState,
  endImpersonation: async () => {},
  isLoading: false,
});

export function useImpersonation() {
  return useContext(ImpersonationContext);
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonation, setImpersonation] = useState<ImpersonationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check for client-side cookies on mount
  useEffect(() => {
    const isImpersonating = document.cookie.includes('is_impersonating=true');
    
    if (isImpersonating) {
      console.log('[Impersonation] Client-side cookie detected, fetching details');
      checkImpersonationStatus();
    }
  }, []);

  // Check impersonation status from API
  const checkImpersonationStatus = async () => {
    try {
      console.log('[Impersonation] Checking status from API');
      setIsLoading(true);
      const response = await fetch('/api/admin/users/impersonation-status');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Impersonation] Status response:', data);
        
        if (data.isImpersonating) {
          setImpersonation({
            isImpersonating: true,
            adminName: data.adminName,
            adminId: data.adminId,
            userName: data.userName,
            userId: data.userId,
            userRole: data.userRole as UserRole || UserRole.VENDOR,
          });
          console.log('[Impersonation] Active with role:', data.userRole);
        } else {
          // Reset if not impersonating
          setImpersonation(initialState);
          console.log('[Impersonation] Not active');
        }
      }
    } catch (error) {
      console.error('[Impersonation] Error checking status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const endImpersonation = async () => {
    try {
      console.log('[Impersonation] Ending impersonation');
      setIsLoading(true);
      
      const response = await fetch('/api/admin/users/end-impersonation', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to end impersonation');
      }

      const data = await response.json();
      setImpersonation(initialState);
      
      // Force a complete page refresh
      console.log('[Impersonation] Redirecting to:', data.redirectPath);
      window.location.href = data.redirectPath;
    } catch (error) {
      console.error('[Impersonation] Error ending impersonation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImpersonationContext.Provider value={{ impersonation, endImpersonation, isLoading }}>
      {children}
    </ImpersonationContext.Provider>
  );
} 