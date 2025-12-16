'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import serverToast from '@/lib/services/toast.service';

// This hook wraps the toast service to work in client components
export function useClientToast() {
  const toast = useToast();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Replace server-side toast methods with client-side ones
    if (serverToast._useClientToast) {
      serverToast.success = (message, options) => toast.success(message, options);
      serverToast.error = (message, options) => toast.error(message, options);
      serverToast.warning = (message, options) => toast.warning(message, options);
      serverToast.info = (message, options) => toast.info(message, options);
      serverToast.custom = (options) => toast.toast(options);
      serverToast.dismiss = (id) => toast.dismiss(id);
    }
  }, [toast]);
  
  return isClient ? toast : { ...serverToast };
}