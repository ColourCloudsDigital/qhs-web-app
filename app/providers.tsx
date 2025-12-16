'use client';

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/providers/toast-provider';
import CookieConsentProvider from '@/components/providers/CookieConsentProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window is focused
    >
      <ThemeProvider attribute="class" defaultTheme="light">
        <ToastProvider>
          <CookieConsentProvider>
            {children}
          </CookieConsentProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}