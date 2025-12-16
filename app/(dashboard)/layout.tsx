'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types/enums';
import { getDashboardPath } from '@/lib/dashboard-utils';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import NetworkStatus from '@/components/common/NetworkStatus';
import InstallPrompt from '@/components/common/InstallPrompt';
import NotificationPrompt from '@/components/common/NotificationPrompt';
import OfflineQueue from '@/components/client/OfflineQueue';
import '@/styles/tailwind.css';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Register service worker for PWA
  useEffect(() => {
    // Temporarily disabled service worker registration to troubleshoot errors
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                  } else {
                    console.log('Content is cached for offline use.');
                    setIsOfflineMode(true);
                  }
                }
              };
            }
          };
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
    */

    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Only show install prompt if not already installed
    if (!isInstalled) {
      // Show install prompt after 3 seconds of using the app
      const installPromptTimer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      
      return () => clearTimeout(installPromptTimer);
    }
  }, []);

  // Prompt for notification permission
  useEffect(() => {
    // Wait to ensure we don't overwhelm the user with prompts
    const notificationTimer = setTimeout(() => {
      // Check if notification permission is not granted yet
      if (
        typeof Notification !== 'undefined' && 
        Notification.permission !== 'granted' && 
        Notification.permission !== 'denied'
      ) {
        setShowNotificationPrompt(true);
      }
    }, 5000);
    
    return () => clearTimeout(notificationTimer);
  }, []);

  // Dashboard redirection logic
  useEffect(() => {
    if (status === 'authenticated') {
      if (window.location.pathname === '/dashboard') {
        if (session?.user?.role) {
          const userRole = session.user.role as UserRole;
          const redirectPath = getDashboardPath(userRole);
          if (redirectPath && redirectPath !== '/') {
            router.push(redirectPath);
          } else if (redirectPath === '/') {
            console.warn(`DashboardLayout: Role '${userRole}' for /dashboard resulted in default redirect path '/'.`);
            router.push('/'); 
          }
        } else {
          console.warn('DashboardLayout: Authenticated at /dashboard, but user role not yet available in session.');
        }
      }
    } else if (status === 'unauthenticated') {
      // If trying to access /dashboard or its children while unauthenticated, redirect to login
      if (window.location.pathname.startsWith('/dashboard')) {
        router.push('/login?callbackUrl=' + window.location.pathname);
      } else {
        router.push('/login?callbackUrl=/dashboard'); // Default callback
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading' || 
      (status === 'unauthenticated' && window.location.pathname.startsWith('/dashboard')) || 
      (status === 'authenticated' && window.location.pathname === '/dashboard' && !session?.user?.role)
     ) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <ImpersonationProvider>
      <div className="h-screen w-full">
        {children}
        
        {/* Network status indicator */}
        <NetworkStatus />
        
        {/* Offline operations queue */}
        <OfflineQueue />
        
        {/* Installation prompt */}
        {showInstallPrompt && (
          <InstallPrompt onClose={() => setShowInstallPrompt(false)} />
        )}
        
        {/* Notification permission prompt */}
        {showNotificationPrompt && (
          <NotificationPrompt onClose={() => setShowNotificationPrompt(false)} />
        )}
      </div>
    </ImpersonationProvider>
  );
}