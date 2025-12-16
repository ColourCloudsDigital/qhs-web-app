'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface InstallPromptProps {
  onClose: () => void;
}

export default function InstallPrompt({ onClose }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // The deferred prompt isn't available, so fallback to normal installation instructions
      // You could direct users to manually add to home screen or desktop here
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // User accepted the installation
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, so clear it
    setDeferredPrompt(null);
    
    // Close the prompt in either case
    onClose();
  };
  
  if (!deferredPrompt) {
    // No installation possible, don't show the prompt
    return null;
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 h-10 w-10 relative">
            <Image
              src="/assets/icons/download.png"
              alt="Install App"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Install App
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Install Qaras Hotels as a desktop app for quicker access and offline functionality.
      </p>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Install
        </button>
      </div>
    </div>
  );
} 