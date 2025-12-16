'use client';

import React, { useEffect } from 'react';
import { ToastProviderComponent, useToast } from '../ui/toast';
import { registerToastHandlers } from '@/lib/toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProviderComponent>
      <ToastHandlerRegistration />
      {children}
    </ToastProviderComponent>
  );
}

// This component registers the toast handlers with the global toast utility
function ToastHandlerRegistration() {
  const { addToast, removeToast } = useToast();
  
  useEffect(() => {
    // Register the toast handlers with the global toast utility
    registerToastHandlers({ addToast, removeToast });
  }, [addToast, removeToast]);
  
  return null;
}