// Server-side safe toast service
// Will use client-side toast if available, otherwise noop

import { ToastOptions } from '@/components/ui/toast';

// Define a safe toast service that works on both client and server
const toast = {
  success: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
    // We're just returning a string ID in server components
    return "toast-id";
  },
  error: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
    return "toast-id";
  },
  warning: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
    return "toast-id";
  },
  info: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
    return "toast-id";
  },
  custom: (options: ToastOptions) => {
    return "toast-id";
  },
  dismiss: (id: string) => {
    // No-op in server component
  },
  // Client-side only, will be replaced in useEffect
  _useClientToast: false,
};

// This will be executed only on the client
if (typeof window !== 'undefined') {
  // Flag that will be checked in components to use the dynamic import
  toast._useClientToast = true;
}

export default toast;