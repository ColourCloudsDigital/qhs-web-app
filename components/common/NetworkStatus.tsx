'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // First check on mount
    setIsOnline(navigator.onLine);
    
    // Handle online status changes
    const handleOnline = () => {
      setIsOnline(true);
      showStatusIndicator();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showStatusIndicator(false); // Don't auto-hide when offline
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check - if offline, show the indicator
    if (!navigator.onLine) {
      setShowStatus(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clear timeout if component unmounts
      if (statusTimeout) {
        clearTimeout(statusTimeout);
      }
    };
  }, [statusTimeout]);
  
  // Function to show status indicator (temporarily for online, permanent for offline)
  const showStatusIndicator = (autoHide = true) => {
    setShowStatus(true);
    
    // Clear existing timeout if there is one
    if (statusTimeout) {
      clearTimeout(statusTimeout);
    }
    
    // Only hide after 5 seconds if we're online and autoHide is true
    if (autoHide && navigator.onLine) {
      const timeout = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      
      setStatusTimeout(timeout);
    }
  };
  
  if (!showStatus && !isOnline) {
    // Always show offline status
    setShowStatus(true);
  }
  
  return (
    <div>
      {/* Show status notification */}
      {(showStatus || !isOnline) && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center rounded-lg px-4 py-3 text-white shadow-lg transition-all ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
          {isOnline ? (
            <Wifi className="mr-2 h-5 w-5" />
          ) : (
            <WifiOff className="mr-2 h-5 w-5" />
          )}
          <span>
            {isOnline
              ? 'You are back online'
              : 'You&apos;re offline. Some features may be limited.'}
          </span>
        </div>
      )}
    </div>
  );
} 